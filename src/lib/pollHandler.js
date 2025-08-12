// src/lib/pollHandler.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';

export async function handleCreatePoll(suggestions, groupId, creatorId, creatorName) {
  console.log('🚀 handleCreatePoll function called!');
  try {
    // 1. Format suggestions into poll options
    console.log('🎯 Creating poll with:', { suggestions, groupId, creatorId, creatorName });
    console.log('🔥 Firebase db object:', db);
    const pollOptions = suggestions.map((suggestion, index) => ({
      id: `option_${index + 1}`,
      title: suggestion.title,
      description: suggestion.description,
      votes: 0,
      voters: [] // Array to track who voted for this option
    }));

    // 2. Create the poll object
    const pollData = {
      title: 'What should we do next?',
      description: 'AI-generated activity suggestions for our group',
      options: pollOptions,
      groupId: groupId,
      groupName: groupId === "group-1" ? "Mountain Adventurers" : groupId === "group-2" ? "Tech Innovators" : groupId === "group-3" ? "Creative Minds" : "Unknown Group",
      createdBy: creatorId,
      createdByName: creatorName,
      createdAt: serverTimestamp(),
      expiresAt: null, // No expiration for now
      isActive: true,
      type: 'ai_activity_suggestions',
      totalVotes: 0
    };

    // 3. Save poll to Firestore
    const pollsCollection = collection(db, 'polls');
    const pollDocRef = await addDoc(pollsCollection, pollData);
    
    console.log('Poll created with ID:', pollDocRef.id);

    // 4. Create a special poll message in chat with the poll ID included
    await postPollToChat(groupId, creatorName, pollData, pollDocRef.id);

    return {
      success: true,
      pollId: pollDocRef.id,
      message: 'Poll created successfully!'
    };

  } catch (error) {
    console.error('Error creating poll:', error);
    console.log('❌ Detailed error:', error.message, error.code, error.stack);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create poll. Please try again.'
    };
  }
}

async function postPollToChat(groupId, creatorName, pollData, pollId) {
  try {
    console.log('📨 Posting poll to chat for group:', groupId);
    
    // Create a special chat message that contains the poll data with the ID
    const chatMessage = {
      groupId: groupId,
      groupName: groupId === "group-1" ? "Mountain Adventurers" : groupId === "group-2" ? "Tech Innovators" : groupId === "group-3" ? "Creative Minds" : "Unknown Group",
      senderId: 'system', // System message
      senderName: 'Activity Planner',
      content: `${creatorName} has created a new activity poll for our group.`,
      timestamp: serverTimestamp(),
      type: 'poll_message',
      pollId: pollId,
      pollData: {
        ...pollData,
        id: pollId // Include the poll ID in the poll data
      },
      metadata: {
        pollTitle: pollData.title,
        pollDescription: pollData.description,
        pollOptions: pollData.options,
        actionText: 'Vote Now',
        actionUrl: `/groups/${groupId}?poll=${pollId}`
      }
    };

    // Add to the group's chat messages collection
    const messagesCollection = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesCollection, chatMessage);
    
    console.log('Poll posted to chat successfully');

  } catch (error) {
    console.error('Error posting poll to chat:', error);
    // Don't throw here - the poll was already created successfully
  }
}