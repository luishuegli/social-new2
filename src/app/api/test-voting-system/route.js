// src/app/api/test-voting-system/route.js
import { db } from '../../Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { recordVoteHistory, analyzeVotingPatterns } from '../../../lib/aiVotingHistory';

export async function GET() {
  try {
    console.log('🧪 Testing voting system end-to-end...');
    
    // 1. Create a test poll
    const pollData = {
      title: 'What should we do next?',
      description: 'AI-generated activity suggestions for our group',
      options: [
        { 
          id: 'option_1', 
          title: 'Hike Lands End Trail', 
          description: 'Beautiful coastal trail with stunning ocean views',
          votes: 0, 
          voters: [] 
        },
        { 
          id: 'option_2', 
          title: 'Board game cafe in the Inner Richmond', 
          description: 'Cozy cafe with great board game selection',
          votes: 0, 
          voters: [] 
        },
        { 
          id: 'option_3', 
          title: 'Explore new restaurants in the Mission District', 
          description: 'Food tour of the latest culinary hotspots',
          votes: 0, 
          voters: [] 
        }
      ],
      groupId: 'test-group-1',
      groupName: 'Test Group',
      createdBy: 'test-user-1',
      createdByName: 'luishuegli',
      createdAt: serverTimestamp(),
      expiresAt: null,
      isActive: true,
      type: 'ai_activity_suggestions',
      totalVotes: 0
    };
    
    // Save poll to Firestore
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);
    console.log('✅ Test poll created with ID:', pollDoc.id);
    
    // 2. Create a poll message in chat
    const chatMessage = {
      groupId: 'test-group-1',
      groupName: 'Test Group',
      senderId: 'system',
      senderName: 'Activity Planner',
      content: 'luishuegli has created a new activity poll for our group.',
      timestamp: serverTimestamp(),
      type: 'poll_message',
      pollId: pollDoc.id,
      pollData: {
        ...pollData,
        id: pollDoc.id
      },
      metadata: {
        pollTitle: pollData.title,
        pollDescription: pollData.description,
        pollOptions: pollData.options,
        actionText: 'Vote Now',
        actionUrl: `/groups/test-group-1?poll=${pollDoc.id}`
      }
    };
    
    const messagesRef = collection(db, 'groups', 'test-group-1', 'messages');
    const messageDoc = await addDoc(messagesRef, chatMessage);
    console.log('✅ Poll message created in chat with ID:', messageDoc.id);
    
    // 3. Test vote history recording
    await recordVoteHistory(pollDoc.id, 'Hike Lands End Trail', 'test-user-1', 'test-group-1');
    await recordVoteHistory(pollDoc.id, 'Board game cafe in the Inner Richmond', 'test-user-2', 'test-group-1');
    await recordVoteHistory(pollDoc.id, 'Hike Lands End Trail', 'test-user-3', 'test-group-1');
    console.log('✅ Vote history recorded for 3 test votes');
    
    // 4. Test voting pattern analysis
    const votingPatterns = await analyzeVotingPatterns('test-group-1');
    console.log('✅ Voting patterns analyzed:', votingPatterns);
    
    return Response.json({ 
      success: true, 
      message: 'Voting system test completed successfully!',
      results: {
        pollId: pollDoc.id,
        messageId: messageDoc.id,
        votingPatterns: votingPatterns
      }
    });
    
  } catch (error) {
    console.error('❌ Voting system test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 