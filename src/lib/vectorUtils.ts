// src/lib/vectorUtils.ts
import { UserProfile, CoreInterest } from '@/app/types/firestoreSchema';

const VECTOR_DIMENSION = 128; // Standard dimension for embeddings

// Predefined interest tags - in production, fetch from Firestore
const ALL_INTEREST_TAGS = [
  '#golf', '#tennis', '#basketball', '#soccer', '#baseball', '#football',
  '#hiking', '#camping', '#climbing', '#cycling', '#running', '#swimming',
  '#valorant', '#leagueoflegends', '#overwatch', '#minecraft', '#fortnite',
  '#cooking', '#baking', '#coffee', '#wine', '#craft-beer', '#cocktails',
  '#reading', '#writing', '#poetry', '#philosophy', '#history', '#science',
  '#photography', '#painting', '#drawing', '#music', '#guitar', '#piano',
  '#movies', '#anime', '#tv-shows', '#documentaries', '#comedy', '#drama',
  '#meditation', '#yoga', '#mindfulness', '#spirituality', '#wellness',
  '#coding', '#ai', '#blockchain', '#startups', '#investing', '#crypto',
  '#travel', '#languages', '#culture', '#volunteering', '#activism',
  '#boardgames', '#chess', '#puzzles', '#trivia', '#escape-rooms',
  '#dancing', '#salsa', '#hip-hop', '#ballet', '#contemporary',
  '#fashion', '#streetwear', '#vintage', '#thrifting', '#sneakers'
];

// Map archetype to vector indices
const ARCHETYPE_INDICES = {
  'creator': 0,
  'explorer': 1,
  'organizer': 2,
  'participant': 3
};

// Map social tempo to vector indices
const TEMPO_INDICES = {
  'one-on-one': 4,
  'small-group': 5,
  'large-group': 6
};

// Map connection intent to vector indices
const INTENT_INDICES = {
  'spontaneous': 7,
  'planned': 8,
  'both': 9
};

// A simple hashing function to map a string to an index
function getIndexForTag(tag: string): number {
  // Reserve first 10 indices for archetype/tempo/intent
  const RESERVED_INDICES = 10;
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Map to remaining indices
  return RESERVED_INDICES + (Math.abs(hash) % (VECTOR_DIMENSION - RESERVED_INDICES));
}

// Function to convert a user's static DNA into a vector representation
export function generateVectorFromDna(dna: UserProfile['dna']): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);

  // Encode archetype (indices 0-3)
  if (dna.archetype) {
    vector[ARCHETYPE_INDICES[dna.archetype]] = 1.0;
  }

  // Encode social tempo (indices 4-6)
  if (dna.socialTempo) {
    vector[TEMPO_INDICES[dna.socialTempo]] = 0.8;
  }

  // Encode connection intent (indices 7-9)
  if (dna.connectionIntent) {
    if (dna.connectionIntent === 'both') {
      vector[INTENT_INDICES['spontaneous']] = 0.5;
      vector[INTENT_INDICES['planned']] = 0.5;
    } else {
      vector[INTENT_INDICES[dna.connectionIntent]] = 0.8;
    }
  }

  // Encode interests with passion weights (indices 10+)
  dna.coreInterests.forEach(interest => {
    const index = getIndexForTag(interest.tag);
    let value = 1.0; // Base value for casual
    
    if (interest.passion === 'passionate') value = 1.5;
    if (interest.passion === 'pro') value = 2.0;
    
    // Amplify slightly if it's an in-person interest (valued higher for real-world connections)
    if (interest.type === 'in-person') value *= 1.1;
    
    vector[index] = Math.max(vector[index], value); // Use max to avoid overwriting
  });
  
  return normalize(vector);
}

// Function to normalize a vector (ensure its length is 1)
export function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

// Function to calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function to update preference vector based on user action
export function updatePreferenceVector(
  currentVector: number[],
  targetVector: number[],
  action: 'connect' | 'skip',
  learningRate: number = 0.05
): number[] {
  let newVector: number[];
  
  if (action === 'connect') {
    // Move towards the target vector
    newVector = currentVector.map((val, i) => 
      val * (1 - learningRate) + targetVector[i] * learningRate
    );
  } else {
    // Move away from the target vector
    newVector = currentVector.map((val, i) => 
      val * (1 + learningRate) - targetVector[i] * learningRate
    );
  }
  
  return normalize(newVector);
}

// Function to calculate DNA match score (for long-term compatibility)
export function calculateDnaMatchScore(
  dnaA: UserProfile['dna'],
  dnaB: UserProfile['dna']
): number {
  let score = 0;
  let totalWeight = 0;

  // Interest overlap (40% weight)
  const interestWeight = 40;
  const sharedInterests = dnaA.coreInterests.filter(a =>
    dnaB.coreInterests.some(b => b.tag === a.tag)
  );
  
  if (dnaA.coreInterests.length > 0 && dnaB.coreInterests.length > 0) {
    const interestOverlap = sharedInterests.length / 
      Math.min(dnaA.coreInterests.length, dnaB.coreInterests.length);
    
    // Bonus for matching passion levels
    let passionBonus = 0;
    sharedInterests.forEach(interestA => {
      const interestB = dnaB.coreInterests.find(b => b.tag === interestA.tag);
      if (interestB && interestA.passion === interestB.passion) {
        passionBonus += 0.1;
      }
    });
    
    score += (interestOverlap + Math.min(passionBonus, 0.3)) * interestWeight;
    totalWeight += interestWeight;
  }

  // Archetype compatibility (20% weight)
  const archetypeWeight = 20;
  const archetypeCompatibility: { [key: string]: string[] } = {
    'creator': ['explorer', 'participant', 'creator'],
    'explorer': ['creator', 'organizer', 'explorer'],
    'organizer': ['participant', 'explorer', 'organizer'],
    'participant': ['organizer', 'creator', 'participant']
  };
  
  if (dnaA.archetype && dnaB.archetype) {
    const isCompatible = archetypeCompatibility[dnaA.archetype]?.includes(dnaB.archetype);
    score += (isCompatible ? 1 : 0.3) * archetypeWeight;
    totalWeight += archetypeWeight;
  }

  // Social tempo compatibility (20% weight)
  const tempoWeight = 20;
  if (dnaA.socialTempo && dnaB.socialTempo) {
    if (dnaA.socialTempo === dnaB.socialTempo) {
      score += tempoWeight;
    } else {
      // Partial credit for adjacent tempos
      const tempoOrder = ['one-on-one', 'small-group', 'large-group'];
      const indexA = tempoOrder.indexOf(dnaA.socialTempo);
      const indexB = tempoOrder.indexOf(dnaB.socialTempo);
      const distance = Math.abs(indexA - indexB);
      score += (1 - distance * 0.3) * tempoWeight;
    }
    totalWeight += tempoWeight;
  }

  // Connection intent compatibility (10% weight)
  const intentWeight = 10;
  if (dnaA.connectionIntent && dnaB.connectionIntent) {
    if (dnaA.connectionIntent === dnaB.connectionIntent || 
        dnaA.connectionIntent === 'both' || 
        dnaB.connectionIntent === 'both') {
      score += intentWeight;
    } else {
      score += 0.3 * intentWeight;
    }
    totalWeight += intentWeight;
  }

  // Language compatibility (10% weight)
  const languageWeight = 10;
  if (dnaA.languages?.length && dnaB.languages?.length) {
    const sharedLanguages = dnaA.languages.filter(lang => 
      dnaB.languages.includes(lang)
    );
    if (sharedLanguages.length > 0) {
      score += languageWeight;
    }
    totalWeight += languageWeight;
  }

  // Normalize score to 0-100
  return totalWeight > 0 ? (score / totalWeight) * 100 : 50;
}

// Export all interest tags for use in other modules
export { ALL_INTEREST_TAGS, VECTOR_DIMENSION };
