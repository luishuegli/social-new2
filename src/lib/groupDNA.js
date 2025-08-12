// Group DNA Recommendation Engine
// Implements Average Strategy and Least Misery Strategy for group recommendations

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';

/**
 * Generate Group DNA based on member preferences
 * @param {string} groupId - The group ID
 * @returns {Object} Group DNA with both strategies
 */
export async function generateGroupDNA(groupId) {
  try {
    console.log('🧬 Generating Group DNA for:', groupId);

    // Get group members
    const membersRef = collection(db, 'groups', groupId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    if (membersSnapshot.empty) {
      console.log('❌ No members found for group:', groupId);
      return null;
    }

    // Get user preferences for all members
    const memberPreferences = [];
    for (const memberDoc of membersSnapshot.docs) {
      const memberId = memberDoc.data().userId;
      const userPrefs = await getUserPreferences(memberId);
      if (userPrefs) {
        memberPreferences.push(userPrefs);
      }
    }

    if (memberPreferences.length === 0) {
      console.log('❌ No preferences found for group members');
      return null;
    }

    console.log('👥 Member preferences loaded:', memberPreferences.length);

    // Calculate both strategies
    const averageStrategy = calculateAverageStrategy(memberPreferences);
    const leastMiseryStrategy = calculateLeastMiseryStrategy(memberPreferences);

    const groupDNA = {
      averageStrategy,
      leastMiseryStrategy,
      memberCount: memberPreferences.length,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Group DNA generated:', groupDNA);
    return groupDNA;

  } catch (error) {
    console.error('❌ Error generating Group DNA:', error);
    return null;
  }
}

/**
 * Get user preferences from their profile
 * @param {string} userId - The user ID
 * @returns {Object} User preferences
 */
async function getUserPreferences(userId) {
  try {
    // Mock user preferences - in production this would query the users collection
    // This simulates getting user data from Social Portfolio
    const mockPreferences = {
      activityTypes: ['Food & Drink', 'Outdoors & Adventure'],
      budget: '$$',
      radius: 25,
      skills: ['Photography', 'Cooking'],
      interests: ['Travel', 'Food', 'Nature']
    };

    return {
      userId,
      ...mockPreferences
    };
  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return null;
  }
}

/**
 * Calculate Average Strategy - takes the average of all member preferences
 * @param {Array} memberPreferences - Array of member preference objects
 * @returns {Object} Average strategy preferences
 */
function calculateAverageStrategy(memberPreferences) {
  console.log('📊 Calculating Average Strategy...');

  // Aggregate activity types (most common ones)
  const activityTypeCounts = {};
  memberPreferences.forEach(member => {
    member.activityTypes?.forEach(type => {
      activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
    });
  });

  const topActivityTypes = Object.entries(activityTypeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  // Average budget (convert to numeric, average, convert back)
  const budgetMap = { 'Free': 0, '$': 1, '$$': 2, '$$$': 3 };
  const budgetValues = memberPreferences
    .map(member => budgetMap[member.budget] || 1)
    .filter(val => val !== undefined);
  
  const avgBudget = budgetValues.reduce((sum, val) => sum + val, 0) / budgetValues.length;
  const budgetKeys = Object.keys(budgetMap);
  const averageBudget = budgetKeys[Math.round(avgBudget)] || '$$';

  // Average radius
  const radiusValues = memberPreferences
    .map(member => member.radius)
    .filter(val => typeof val === 'number');
  
  const averageRadius = radiusValues.length > 0 
    ? Math.round(radiusValues.reduce((sum, val) => sum + val, 0) / radiusValues.length)
    : 25;

  return {
    activityTypes: topActivityTypes,
    budget: averageBudget,
    radius: averageRadius,
    strategy: 'average'
  };
}

/**
 * Calculate Least Misery Strategy - chooses options that minimize maximum dissatisfaction
 * Used especially for food-related activities
 * @param {Array} memberPreferences - Array of member preference objects
 * @returns {Object} Least misery strategy preferences
 */
function calculateLeastMiseryStrategy(memberPreferences) {
  console.log('😰 Calculating Least Misery Strategy...');

  // For activity types, find intersection (types everyone likes)
  let commonActivityTypes = memberPreferences[0]?.activityTypes || [];
  memberPreferences.slice(1).forEach(member => {
    commonActivityTypes = commonActivityTypes.filter(type => 
      member.activityTypes?.includes(type)
    );
  });

  // If no common types, fall back to most popular
  if (commonActivityTypes.length === 0) {
    const activityTypeCounts = {};
    memberPreferences.forEach(member => {
      member.activityTypes?.forEach(type => {
        activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
      });
    });
    
    commonActivityTypes = Object.entries(activityTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([type]) => type);
  }

  // For budget, choose the minimum (most conservative)
  const budgetMap = { 'Free': 0, '$': 1, '$$': 2, '$$$': 3 };
  const budgetValues = memberPreferences
    .map(member => budgetMap[member.budget] || 1)
    .filter(val => val !== undefined);
  
  const minBudget = Math.min(...budgetValues);
  const budgetKeys = Object.keys(budgetMap);
  const conservativeBudget = budgetKeys[minBudget] || '$';

  // For radius, choose the minimum (most conservative)
  const radiusValues = memberPreferences
    .map(member => member.radius)
    .filter(val => typeof val === 'number');
  
  const conservativeRadius = radiusValues.length > 0 
    ? Math.min(...radiusValues)
    : 15; // Default to smaller radius

  return {
    activityTypes: commonActivityTypes,
    budget: conservativeBudget,
    radius: conservativeRadius,
    strategy: 'leastMisery'
  };
}

/**
 * Get appropriate strategy based on activity type
 * @param {string} activityType - The type of activity
 * @param {Object} groupDNA - The group DNA object
 * @returns {Object} Appropriate strategy preferences
 */
export function getStrategyForActivity(activityType, groupDNA) {
  if (!groupDNA) return null;

  // Use Least Misery Strategy for food-related activities
  if (activityType === 'Food & Drink') {
    console.log('🍽️ Using Least Misery Strategy for food activity');
    return groupDNA.leastMiseryStrategy;
  }

  // Use Average Strategy for other activities
  console.log('📊 Using Average Strategy for activity:', activityType);
  return groupDNA.averageStrategy;
}

/**
 * Create user profile vector from Social Portfolio
 * @param {string} userId - The user ID
 * @returns {Object} User profile vector
 */
export async function createUserProfileVector(userId) {
  try {
    console.log('👤 Creating user profile vector for:', userId);

    // Mock Social Portfolio data - in production this would query user posts and interactions
    const socialPortfolio = {
      explicitSkills: ['Photography', 'Cooking', 'Hiking'],
      implicitInterests: ['Travel', 'Food', 'Nature', 'Art'],
      activityHistory: [
        { type: 'Food & Drink', frequency: 8, satisfaction: 4.5 },
        { type: 'Outdoors & Adventure', frequency: 6, satisfaction: 4.8 },
        { type: 'Creative & Arts', frequency: 3, satisfaction: 4.2 }
      ],
      socialConnections: ['friend1', 'friend2', 'friend3'],
      locationHistory: ['San Francisco', 'Oakland', 'Berkeley']
    };

    // Weight explicit skills more heavily than implicit interests
    const profileVector = {
      skills: socialPortfolio.explicitSkills.map(skill => ({
        name: skill,
        weight: 1.0,
        source: 'explicit'
      })),
      interests: socialPortfolio.implicitInterests.map(interest => ({
        name: interest,
        weight: 0.7,
        source: 'implicit'
      })),
      preferences: {
        activityTypes: socialPortfolio.activityHistory
          .sort((a, b) => (b.frequency * b.satisfaction) - (a.frequency * a.satisfaction))
          .slice(0, 3)
          .map(activity => activity.type),
        budget: '$$', // Could be inferred from spending history
        radius: 25 // Could be inferred from location patterns
      }
    };

    console.log('✅ User profile vector created:', profileVector);
    return profileVector;

  } catch (error) {
    console.error('❌ Error creating user profile vector:', error);
    return null;
  }
}