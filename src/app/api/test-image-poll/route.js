import { NextResponse } from 'next/server';
import { db } from '../../Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    // Create a test poll with specific restaurants and venues
    const pollData = {
      title: "Where should we eat tonight?",
      description: "Let's pick a great restaurant for dinner!",
      type: "image_poll",
      groupId: "group-6",
      groupName: "Food Enthusiasts",
      createdBy: "current-user",
      createdByName: "Current User",
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 60000), // 60 seconds from now
      totalVotes: 0,
      options: [
        {
          id: "option-1",
          title: "The Grand Bistro",
          description: "Upscale French bistro with seasonal menu, craft cocktails, and intimate atmosphere. Perfect for special occasions.",
          imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
          votes: 0,
          voters: []
        },
        {
          id: "option-2",
          title: "Sakura Sushi Bar",
          description: "Authentic Japanese sushi and sashimi, fresh daily. Omakase experience available. Cozy atmosphere with traditional decor.",
          imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop",
          votes: 0,
          voters: []
        },
        {
          id: "option-3",
          title: "La Piazza Trattoria",
          description: "Family-owned Italian restaurant with homemade pasta, wood-fired pizzas, and extensive wine list. Warm, rustic ambiance.",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop",
          votes: 0,
          voters: []
        },
        {
          id: "option-4",
          title: "The Craft Beer Garden",
          description: "Casual gastropub with 20+ craft beers on tap, gourmet burgers, and outdoor seating. Great for groups and casual dining.",
          imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
          votes: 0,
          voters: []
        }
      ]
    };

    // Add to polls collection
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);

    // Create a message in the group chat
    const messageData = {
      type: 'image_poll',
      pollId: pollDoc.id,
      content: `🍽️ New Restaurant Poll: ${pollData.title}`,
      senderId: 'current-user',
      senderName: 'Current User',
      timestamp: serverTimestamp(),
      groupId: 'group-6'
    };

    const messagesRef = collection(db, 'groups', 'group-6', 'messages');
    await addDoc(messagesRef, messageData);

    return NextResponse.json({
      success: true,
      pollId: pollDoc.id,
      message: 'Restaurant poll created successfully',
      poll: {
        id: pollDoc.id,
        ...pollData
      }
    });

  } catch (error) {
    console.error('Error creating restaurant poll:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant poll', details: error.message },
      { status: 500 }
    );
  }
} 