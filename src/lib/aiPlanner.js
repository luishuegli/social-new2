// src/lib/aiPlanner.js
import { analyzeVotingPatterns } from './aiVotingHistory';

export async function getAISuggestions(parameters, groupId) {
  try {
    console.log('🤖 Getting AI suggestions with parameters:', parameters);
    
    // Get voting history to inform suggestions
    let votingContext = '';
    try {
      const votingPatterns = await analyzeVotingPatterns(groupId);
      if (votingPatterns.totalVotes > 0) {
        const popularActivities = votingPatterns.popularActivities
          .map(item => `${item.activity} (${item.votes} votes)`)
          .join(', ');
        votingContext = `Based on previous group votes, popular activities include: ${popularActivities}. Consider suggesting similar activities.`;
      }
    } catch (error) {
      console.log('No voting history available for this group yet');
    }

    const requestBody = {
      parameters: parameters,
      groupId: groupId,
      votingContext: votingContext
    };

    console.log('📡 Sending request to AI API with voting context...');
    
    const response = await fetch('/api/ai-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI suggestions received:', data);

    return data.suggestions;
  } catch (error) {
    console.error('❌ Error getting AI suggestions:', error);
    throw error;
  }
}