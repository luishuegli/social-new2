// src/app/api/test-chat-poll/route.js
import { db } from '../../Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🧪 Creating test poll for group-6...');
    
    // Create a test poll that matches the screenshot
    const pollData = {
      title: 'Activity Poll: What should we do next?',
      description: 'AI-generated activity suggestions for our group',
      options: [
        { 
          id: 'option_1', 
          title: 'Downtown Culinary Expedition', 
          description: 'Explore a vibrant neighborhood\'s culinary scene with a guided walking tour, featuring tastings at several acclaimed restaurants, specialty shops, and hidden gems. Learn about the local food history and culture while indulging in diverse flavors.',
          votes: 0, 
          voters: [] 
        },
        { 
          id: 'option_2', 
          title: 'Michelin-Starred Dining Experience', 
          description: 'Indulge in a multi-course tasting menu at a renowned restaurant, offering innovative cuisine paired with exquisite wines. A sophisticated culinary journey designed for discerning palates.',
          votes: 0, 
          voters: [] 
        },
        { 
          id: 'option_3', 
          title: 'Craft Cocktail Masterclass & Tasting', 
          description: 'Learn the art of cocktail creation from an expert mixologist. Guests will create and sample several unique drinks, accompanied by gourmet appetizers, in a fun and interactive setting.',
          votes: 0, 
          voters: [] 
        }
      ],
      groupId: 'group-6',
      groupName: 'Food Enthusiasts',
      createdBy: 'current-user',
      createdByName: 'Current User',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 60000), // 60 seconds from now
      isActive: true,
      type: 'activity_poll',
      totalVotes: 0
    };
    
    // Save poll to Firestore
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);
    console.log('✅ Test poll created with ID:', pollDoc.id);
    
    // Create a special poll message in chat with the poll ID included
    const chatMessage = {
      groupId: 'group-6',
      groupName: 'Food Enthusiasts',
      senderId: 'current-user',
      senderName: 'Current User',
      content: 'Current User has created a new activity poll for our group.',
      timestamp: serverTimestamp(),
      type: 'poll_message',
      pollId: pollDoc.id, // This is the key field that was missing
      pollData: {
        ...pollData,
        id: pollDoc.id // Also include the ID in the poll data
      },
      metadata: {
        pollTitle: pollData.title,
        pollDescription: pollData.description,
        pollOptions: pollData.options,
        actionText: 'Vote Now',
        actionUrl: `/groups/group-6?poll=${pollDoc.id}`
      }
    };
    
    // Add to the group's chat messages collection
    const messagesRef = collection(db, 'groups', 'group-6', 'messages');
    const messageDoc = await addDoc(messagesRef, chatMessage);
    console.log('✅ Poll message created in chat with ID:', messageDoc.id);
    console.log('✅ Poll ID in message:', chatMessage.pollId);
    console.log('✅ Poll ID in pollData:', chatMessage.pollData.id);
    
    return Response.json({ 
      success: true, 
      message: 'Test poll created and posted to chat successfully!',
      results: {
        pollId: pollDoc.id,
        messageId: messageDoc.id,
        pollIdInMessage: chatMessage.pollId,
        pollIdInPollData: chatMessage.pollData.id,
        groupId: 'group-6',
        expiresIn: '60 seconds'
      }
    });
    
  } catch (error) {
    console.error('❌ Test chat poll failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 