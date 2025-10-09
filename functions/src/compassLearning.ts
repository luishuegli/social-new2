// functions/src/compassLearning.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { generateVectorFromDna, updatePreferenceVector } from './vectorUtils';

// Initialize admin if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Hyperparameters (can be adjusted based on system performance)
const LEARNING_RATE = 0.05;
const MIN_VECTOR_DIMENSION = 128;

/**
 * Cloud Function triggered when a new swipe is logged
 * Updates the user's preference vector based on their action
 */
export const updateUserPreferenceVector = onDocumentCreated(
  'swipe_log/{logId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const swipe = snapshot.data();
    
    // Validate swipe data
    if (!swipe.swiperId || !swipe.targetId || !swipe.action) {
      console.error('Invalid swipe data:', swipe);
      return null;
    }

    try {
      // Get both user profiles
      const swiperRef = db.collection('users').doc(swipe.swiperId);
      const targetRef = db.collection('users').doc(swipe.targetId);

      const [swiperDoc, targetDoc] = await Promise.all([
        swiperRef.get(),
        targetRef.get()
      ]);

      if (!swiperDoc.exists || !targetDoc.exists) {
        console.error('User not found:', { 
          swiper: swiperDoc.exists, 
          target: targetDoc.exists 
        });
        return null;
      }

      const swiperData = swiperDoc.data();
      const targetData = targetDoc.data();

      // Check if swiper has preference vector
      if (!swiperData?.compass?.preferenceVector || 
          swiperData.compass.preferenceVector.length < MIN_VECTOR_DIMENSION) {
        console.log('Swiper preference vector not initialized');
        return null;
      }

      // Check if target has DNA
      if (!targetData?.dna?.coreInterests) {
        console.log('Target DNA not configured');
        return null;
      }

      // Get current preference vector
      const currentVector = swiperData.compass.preferenceVector;
      
      // Generate target's DNA vector
      const targetVector = generateVectorFromDna(targetData.dna);

      // Update preference vector based on action
      const updatedVector = updatePreferenceVector(
        currentVector,
        targetVector,
        swipe.action,
        LEARNING_RATE
      );

      // Update the user's preference vector in Firestore
      await swiperRef.update({
        'compass.preferenceVector': updatedVector,
        'compass.lastLearningUpdate': admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Updated preference vector for user ${swipe.swiperId} based on ${swipe.action} action`);
      
      // Optional: Track learning metrics
      await logLearningMetrics(swipe.swiperId, swipe.action, currentVector, updatedVector);

      return { success: true, userId: swipe.swiperId };

    } catch (error) {
      console.error('Error updating preference vector:', error);
      
      // Log error to a monitoring collection
      await db.collection('compass_errors').add({
        type: 'preference_update_failed',
        swipeId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  }
);

/**
 * Scheduled function to refresh connection tokens daily
 */
export const refreshConnectionTokens = onSchedule(
  'every 24 hours',
  async (event) => {
    const DAILY_TOKEN_REFRESH = 3; // Users get 3 new tokens daily
    const MAX_TOKENS = 10; // Maximum tokens a user can have
    
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Query active users (those who were active in the last 7 days)
      const activeUsersQuery = db.collection('users')
        .where('compass.lastActiveTimestamp', '>', oneDayAgo)
        .where('compass.discoverable', '==', true);
      
      const snapshot = await activeUsersQuery.get();
      
      const batch = db.batch();
      let updateCount = 0;
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        const currentTokens = userData.compass?.connectionTokens?.count || 0;
        
        // Only add tokens if user is below max
        if (currentTokens < MAX_TOKENS) {
          const newTokenCount = Math.min(currentTokens + DAILY_TOKEN_REFRESH, MAX_TOKENS);
          
          batch.update(doc.ref, {
            'compass.connectionTokens.count': newTokenCount,
            'compass.connectionTokens.refreshedAt': admin.firestore.FieldValue.serverTimestamp()
          });
          
          updateCount++;
        }
      });
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`Refreshed connection tokens for ${updateCount} users`);
      }
      
      console.log(`Token refresh complete: ${updateCount} users updated`);
      
    } catch (error) {
      console.error('Error refreshing connection tokens:', error);
      
      await db.collection('compass_errors').add({
        type: 'token_refresh_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
);

/**
 * Helper function to log learning metrics for analysis
 */
async function logLearningMetrics(
  userId: string,
  action: string,
  oldVector: number[],
  newVector: number[]
) {
  try {
    // Calculate vector change magnitude
    let changeMagnitude = 0;
    for (let i = 0; i < oldVector.length; i++) {
      changeMagnitude += Math.abs(newVector[i] - oldVector[i]);
    }
    
    await db.collection('compass_metrics').add({
      userId,
      action,
      changeMagnitude,
      learningRate: LEARNING_RATE,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    // Don't fail the main function if metrics logging fails
    console.warn('Failed to log learning metrics:', error);
  }
}