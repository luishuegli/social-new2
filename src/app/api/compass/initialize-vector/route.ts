// src/app/api/compass/initialize-vector/route.ts
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/Lib/firebaseAdmin';
import { UserProfile } from '@/app/types/firestoreSchema';
import { generateVectorFromDna, VECTOR_DIMENSION } from '@/lib/vectorUtils';

const INITIAL_CONNECTION_TOKENS = 10; // New users start with 10 connection tokens

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

    // Get user profile
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() as UserProfile;

    // Validate that DNA has been set
    if (!userData.dna || !userData.dna.coreInterests || userData.dna.coreInterests.length === 0) {
      return NextResponse.json({ 
        error: 'User DNA not configured. Please complete onboarding first.' 
      }, { status: 400 });
    }

    // Generate initial preference vector from DNA
    const preferenceVector = generateVectorFromDna(userData.dna);

    // Initialize or update the compass configuration
    const compassUpdate = {
      'compass.preferenceVector': preferenceVector,
      'compass.discoverable': true,
      'compass.lastActiveTimestamp': FieldValue.serverTimestamp(),
      'compass.seenProfileIds': userData.compass?.seenProfileIds || {},
      'compass.connectionTokens': {
        count: userData.compass?.connectionTokens?.count ?? INITIAL_CONNECTION_TOKENS,
        refreshedAt: FieldValue.serverTimestamp()
      }
    };

    // Update the user profile
    await userRef.update(compassUpdate);

    return NextResponse.json({ 
      success: true,
      message: 'Preference vector initialized successfully',
      vectorDimension: VECTOR_DIMENSION,
      connectionTokens: userData.compass?.connectionTokens?.count ?? INITIAL_CONNECTION_TOKENS
    });

  } catch (error) {
    console.error('Error in initialize-vector:', error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// Optional: GET endpoint to check if vector is initialized
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() as UserProfile;
    
    const isInitialized = !!(
      userData.compass?.preferenceVector?.length === VECTOR_DIMENSION &&
      userData.dna?.coreInterests?.length > 0
    );

    return NextResponse.json({ 
      initialized: isInitialized,
      hasCompass: !!userData.compass,
      hasDna: !!userData.dna,
      vectorLength: userData.compass?.preferenceVector?.length || 0,
      interestsCount: userData.dna?.coreInterests?.length || 0,
      connectionTokens: userData.compass?.connectionTokens?.count || 0,
      discoverable: userData.compass?.discoverable || false
    });

  } catch (error) {
    console.error('Error checking vector status:', error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
