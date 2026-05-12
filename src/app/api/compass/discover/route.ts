// src/app/api/compass/discover/route.ts
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/Lib/firebaseAdmin';
import { UserProfile, CoreInterest, MatchResult } from '@/app/types/firestoreSchema';
import { 
  generateVectorFromDna, 
  cosineSimilarity, 
  calculateDnaMatchScore 
} from '@/lib/vectorUtils';
import { Timestamp } from 'firebase-admin/firestore';
import { getUserProfile } from '@/app/services/dataService'; // Import the new service

// Configuration constants
const LONG_TERM_WEIGHT = 0.65;  // DNA compatibility weight
const SHORT_TERM_WEIGHT = 0.35; // Preference vector weight
const CANDIDATE_POOL_SIZE = 200;
const RESULTS_LIMIT = 5; // Reduced for pagination
const SEEN_COOLDOWN_DAYS = 7;

interface ScoredConnection {
  profile: UserProfile;
  score: number;
  dnaScore: number;
  preferenceScore: number;
  sharedInterests: CoreInterest[];
  sparkTitle?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Optional: Accept filter parameters
    const body = await req.json();
    const { interestFilter, locationRadius, searchQuery, lastSeenUserId, limit = RESULTS_LIMIT } = body;

    // Get current user profile
    const currentUserDoc = await adminDb.collection('users').doc(userId).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const currentUser = currentUserDoc.data() as UserProfile;

    // Handle search functionality
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      
      // Search for users by username or display name
      const searchResults = await adminDb.collection('users')
        .where('compass.discoverable', '==', true)
        .limit(20)
        .get();

      const searchConnections = searchResults.docs
        .map(doc => doc.data() as UserProfile)
        .filter(user => 
          user.uid !== userId &&
          (user.username?.toLowerCase().includes(query) || 
           user.displayName?.toLowerCase().includes(query))
        )
        .map(user => ({
          profile: user,
          score: 100, // High score for exact connections
          dnaScore: 50,
          preferenceScore: 50,
          sharedInterests: [],
          sparkTitle: `Found by search`
        }));

      const clientSafeResults: MatchResult[] = searchConnections.map(connection => ({
        profile: {
          uid: connection.profile.uid,
          username: connection.profile.username,
          displayName: connection.profile.displayName,
          bio: connection.profile.bio,
          photoURL: connection.profile.photoURL,
          dna: connection.profile.dna
        },
        score: Math.round(connection.score),
        sharedInterests: connection.sharedInterests,
        sparkTitle: connection.sparkTitle
      }));

    return NextResponse.json({
      status: 'success',
      connections: clientSafeResults,
      count: clientSafeResults.length,
      hasMore: searchConnections.length === limit,
      lastUserId: clientSafeResults.length > 0 ? clientSafeResults[clientSafeResults.length - 1].profile.uid : null
    });
    }

    // Validate user has completed onboarding
    if (!currentUser.dna?.coreInterests || currentUser.dna.coreInterests.length === 0) {
      return NextResponse.json({ 
        status: 'NEEDS_ONBOARDING', 
        connections: [] 
      });
    }

    // --- Layer 1: Candidate Generation ---
    // Get recently seen profiles to exclude
    const sevenDaysAgo = new Date(Date.now() - SEEN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const seenIds = Object.entries(currentUser.compass.seenProfileIds || {})
      .filter(([_, timestamp]) => {
        // Check if timestamp is a Firestore Timestamp
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as any);
        return date > sevenDaysAgo;
      })
      .map(([id, _]) => id);

    // Build the query for candidates - simplified to avoid complex composite indexes
    let candidatesQuery = adminDb.collection('users')
      .where('compass.discoverable', '==', true);

    // Get more candidates initially, we'll filter in memory
    candidatesQuery = candidatesQuery.limit(CANDIDATE_POOL_SIZE * 2);

    const candidatesSnapshot = await candidatesQuery.get();
    
    // Filter out already seen users and build candidate pool
    let candidates = candidatesSnapshot.docs
      .map(doc => doc.data() as UserProfile)
      .filter(c => !seenIds.includes(c.uid) && c.uid !== userId);

    // Apply interest filtering in memory if needed
    if (interestFilter) {
      candidates = candidates.filter(c => 
        c.dna?.coreInterests?.some(interest => interest.tag === interestFilter)
      );
    } else if (currentUser.dna.coreInterests.length > 0) {
      // Filter by user's interests
      const userInterestTags = currentUser.dna.coreInterests.map(i => i.tag);
      candidates = candidates.filter(c => 
        c.dna?.coreInterests?.some(interest => userInterestTags.includes(interest.tag))
      );
    }

    // Limit to the desired candidate pool size
    candidates = candidates.slice(0, CANDIDATE_POOL_SIZE);

    // --- Layer 2: Scoring & Ranking ---
    const scoredMatches: ScoredConnection[] = candidates.map(candidate => {
      // Find shared interests
      const sharedInterests = currentUser.dna.coreInterests.filter(userInterest =>
        candidate.dna.coreInterests.some(candInterest => candInterest.tag === userInterest.tag)
      );

      // Brain 1: DNA Matcher (Long-Term Compatibility)
      const dnaScore = calculateDnaMatchScore(currentUser.dna, candidate.dna);
      
      // Brain 2: Preference Learner (Short-Term Intuition)
      const candidateVector = generateVectorFromDna(candidate.dna);
      const preferenceScore = cosineSimilarity(
        currentUser.compass.preferenceVector,
        candidateVector
      );
      
      // Score Fusion
      // Scale preference score from [-1, 1] to [0, 100]
      const scaledPreferenceScore = ((preferenceScore + 1) / 2) * 100;
      const finalScore = (dnaScore * LONG_TERM_WEIGHT) + (scaledPreferenceScore * SHORT_TERM_WEIGHT);

      // Generate spark title based on shared interests and compatibility
      const sparkTitle = generateSparkTitle(sharedInterests, candidate.dna.archetype);

      return { 
        profile: candidate, 
        score: finalScore,
        dnaScore,
        preferenceScore: scaledPreferenceScore,
        sharedInterests,
        sparkTitle
      };
    });

    // --- Layer 3: Sorting & Diversity ---
    // Sort by score
    scoredMatches.sort((a, b) => b.score - a.score);

    // Apply diversity boost (ensure variety in archetypes and interests)
    const diversifiedMatches = applyDiversityBoost(scoredMatches, currentUser);

    // Handle pagination
    let startIndex = 0;
    if (lastSeenUserId) {
      const lastSeenIndex = diversifiedMatches.findIndex(match => match.profile.uid === lastSeenUserId);
      if (lastSeenIndex !== -1) {
        startIndex = lastSeenIndex + 1;
      }
    }

    // Get paginated results
    const finalResults = diversifiedMatches.slice(startIndex, startIndex + limit);
    
    // --- Layer 4: Prepare Client-Safe Results ---
    const clientSafeResults: MatchResult[] = finalResults.map(match => ({
      profile: {
        uid: match.profile.uid,
        username: match.profile.username,
        displayName: match.profile.displayName,
        photoURL: match.profile.photoURL,
        bio: match.profile.bio,
        dna: {
          archetype: match.profile.dna.archetype,
          coreInterests: match.sharedInterests, // Only send shared interests
          connectionIntent: match.profile.dna.connectionIntent,
          socialTempo: match.profile.dna.socialTempo,
          languages: match.profile.dna.languages,
          // Don't send location for privacy
        },
        // Don't send compass data (internal use only)
      },
      score: Math.round(match.score),
      sparkTitle: match.sparkTitle,
      sharedInterests: match.sharedInterests,
    }));

    return NextResponse.json({ 
      connections: clientSafeResults,
      meta: {
        candidatePoolSize: candidates.length,
        algorithmVersion: '1.0.0',
        weights: {
          longTerm: LONG_TERM_WEIGHT,
          shortTerm: SHORT_TERM_WEIGHT
        }
      },
      pagination: {
        hasMore: finalResults.length === limit && (startIndex + limit) < diversifiedMatches.length,
        lastUserId: clientSafeResults.length > 0 ? clientSafeResults[clientSafeResults.length - 1].profile.uid : null,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Error in discover:', error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// Helper function to generate engaging spark titles
function generateSparkTitle(sharedInterests: CoreInterest[], archetype?: string): string {
  if (sharedInterests.length === 0) {
    const archetypeMessages = {
      'creator': "A fellow creator to inspire with",
      'explorer': "An explorer seeking new adventures",
      'organizer': "Someone who makes things happen",
      'participant': "Ready to join your next adventure"
    };
    return archetype ? (archetypeMessages as any)[archetype] || "Someone new to discover" : "Someone new to discover";
  }

  const topInterest = sharedInterests[0];
  const passionLevel = topInterest.passion;
  
  if (sharedInterests.length === 1) {
    const passionPhrases = {
      'casual': `Enjoys ${topInterest.tag.replace('#', '')}`,
      'passionate': `Passionate about ${topInterest.tag.replace('#', '')}`,
      'pro': `${topInterest.tag.replace('#', '')} expert`
    };
    return passionPhrases[passionLevel];
  }

  if (sharedInterests.length === 2) {
    return `${sharedInterests[0].tag.replace('#', '')} + ${sharedInterests[1].tag.replace('#', '')}`;
  }

  return `${sharedInterests.length} shared interests including ${topInterest.tag.replace('#', '')}`;
}

// Helper function to ensure diversity in results
function applyDiversityBoost(connections: ScoredConnection[], currentUser: UserProfile): ScoredConnection[] {
  if (connections.length <= RESULTS_LIMIT) return connections;

  const diversified: ScoredConnection[] = [];
  const usedArchetypes = new Set<string>();
  const usedPrimaryInterests = new Set<string>();

  // First pass: get top 5 by pure score
  for (let i = 0; i < Math.min(5, connections.length); i++) {
    diversified.push(connections[i]);
    usedArchetypes.add(connections[i].profile.dna.archetype);
    if (connections[i].profile.dna.coreInterests[0]) {
      usedPrimaryInterests.add(connections[i].profile.dna.coreInterests[0].tag);
    }
  }

  // Second pass: add diverse profiles
  for (const connection of connections) {
    if (diversified.length >= RESULTS_LIMIT) break;
    if (diversified.includes(connection)) continue;

    // Boost if different archetype or primary interest
    const hasNewArchetype = !usedArchetypes.has(connection.profile.dna.archetype);
    const hasNewInterest = connection.profile.dna.coreInterests[0] && 
      !usedPrimaryInterests.has(connection.profile.dna.coreInterests[0].tag);

    if (hasNewArchetype || hasNewInterest) {
      diversified.push(connection);
      usedArchetypes.add(connection.profile.dna.archetype);
      if (connection.profile.dna.coreInterests[0]) {
        usedPrimaryInterests.add(connection.profile.dna.coreInterests[0].tag);
      }
    }
  }

  // Fill remaining slots with highest scores
  for (const connection of connections) {
    if (diversified.length >= RESULTS_LIMIT) break;
    if (!diversified.includes(connection)) {
      diversified.push(connection);
    }
  }

  return diversified;
}
