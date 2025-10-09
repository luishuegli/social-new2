"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshConnectionTokens = exports.updateUserPreferenceVector = void 0;
// functions/src/compassLearning.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const vectorUtils_1 = require("./vectorUtils");
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
exports.updateUserPreferenceVector = (0, firestore_1.onDocumentCreated)('swipe_log/{logId}', async (event) => {
    var _a, _b;
    const snapshot = event.data;
    if (!snapshot)
        return null;
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
        if (!((_a = swiperData === null || swiperData === void 0 ? void 0 : swiperData.compass) === null || _a === void 0 ? void 0 : _a.preferenceVector) ||
            swiperData.compass.preferenceVector.length < MIN_VECTOR_DIMENSION) {
            console.log('Swiper preference vector not initialized');
            return null;
        }
        // Check if target has DNA
        if (!((_b = targetData === null || targetData === void 0 ? void 0 : targetData.dna) === null || _b === void 0 ? void 0 : _b.coreInterests)) {
            console.log('Target DNA not configured');
            return null;
        }
        // Get current preference vector
        const currentVector = swiperData.compass.preferenceVector;
        // Generate target's DNA vector
        const targetVector = (0, vectorUtils_1.generateVectorFromDna)(targetData.dna);
        // Update preference vector based on action
        const updatedVector = (0, vectorUtils_1.updatePreferenceVector)(currentVector, targetVector, swipe.action, LEARNING_RATE);
        // Update the user's preference vector in Firestore
        await swiperRef.update({
            'compass.preferenceVector': updatedVector,
            'compass.lastLearningUpdate': admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated preference vector for user ${swipe.swiperId} based on ${swipe.action} action`);
        // Optional: Track learning metrics
        await logLearningMetrics(swipe.swiperId, swipe.action, currentVector, updatedVector);
        return { success: true, userId: swipe.swiperId };
    }
    catch (error) {
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
});
/**
 * Scheduled function to refresh connection tokens daily
 */
exports.refreshConnectionTokens = (0, scheduler_1.onSchedule)('every 24 hours', async (event) => {
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
            var _a, _b;
            const userData = doc.data();
            const currentTokens = ((_b = (_a = userData.compass) === null || _a === void 0 ? void 0 : _a.connectionTokens) === null || _b === void 0 ? void 0 : _b.count) || 0;
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
    }
    catch (error) {
        console.error('Error refreshing connection tokens:', error);
        await db.collection('compass_errors').add({
            type: 'token_refresh_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
/**
 * Helper function to log learning metrics for analysis
 */
async function logLearningMetrics(userId, action, oldVector, newVector) {
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
    }
    catch (error) {
        // Don't fail the main function if metrics logging fails
        console.warn('Failed to log learning metrics:', error);
    }
}
//# sourceMappingURL=compassLearning.js.map