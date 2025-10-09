// functions/src/index.ts
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export all Compass-related functions
export { 
  updateUserPreferenceVector,
  refreshConnectionTokens
} from './compassLearning';

// You can add other cloud functions here as needed
// export { otherFunction } from './otherModule';
