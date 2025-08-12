// src/lib/aiVotingHistory.js
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';

// Track voting history for AI suggestions
export async function recordVoteHistory(pollId, selectedOption, userId, groupId) {
  try {
    console.log('📊 Recording vote history for AI suggestions:', { pollId, selectedOption, userId, groupId });
    
    const voteHistoryData = {
      pollId: pollId,
      selectedOption: selectedOption,
      userId: userId,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: 'ai_activity_vote'
    };
    
    const voteHistoryRef = collection(db, 'ai_vote_history');
    await addDoc(voteHistoryRef, voteHistoryData);
    
    console.log('✅ Vote history recorded successfully');
  } catch (error) {
    console.error('❌ Error recording vote history:', error);
    // Don't throw - this is optional tracking
  }
}

// Get voting history for a group to inform AI suggestions
export async function getGroupVoteHistory(groupId, limit = 50) {
  try {
    console.log('📊 Getting vote history for group:', groupId);
    
    // Simplified query to avoid index requirements
    const voteHistoryRef = collection(db, 'ai_vote_history');
    const snapshot = await getDocs(voteHistoryRef);
    const voteHistory = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by groupId on client side to avoid composite index
      if (data.groupId === groupId) {
        voteHistory.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort by timestamp on client side
    voteHistory.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return b.timestamp.seconds - a.timestamp.seconds;
    });
    
    console.log('✅ Vote history retrieved:', voteHistory.length, 'votes');
    return voteHistory.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting vote history:', error);
    return [];
  }
}

// Analyze voting patterns to improve AI suggestions
export async function analyzeVotingPatterns(groupId) {
  try {
    console.log('📊 Analyzing voting patterns for group:', groupId);
    
    const voteHistory = await getGroupVoteHistory(groupId);
    
    // Count votes by activity type/category
    const activityVotes = {};
    const userPreferences = {};
    
    voteHistory.forEach(vote => {
      const option = vote.selectedOption;
      
      // Track activity type votes
      if (!activityVotes[option]) {
        activityVotes[option] = 0;
      }
      activityVotes[option]++;
      
      // Track user preferences
      if (!userPreferences[vote.userId]) {
        userPreferences[vote.userId] = [];
      }
      userPreferences[vote.userId].push(option);
    });
    
    // Find most popular activities
    const popularActivities = Object.entries(activityVotes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity, votes]) => ({ activity, votes }));
    
    console.log('📊 Voting analysis complete:', {
      totalVotes: voteHistory.length,
      popularActivities,
      uniqueUsers: Object.keys(userPreferences).length
    });
    
    return {
      totalVotes: voteHistory.length,
      popularActivities,
      userPreferences,
      recentVotes: voteHistory.slice(0, 10)
    };
  } catch (error) {
    console.error('❌ Error analyzing voting patterns:', error);
    return {
      totalVotes: 0,
      popularActivities: [],
      userPreferences: {},
      recentVotes: []
    };
  }
} 