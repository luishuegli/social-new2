import { NextResponse } from 'next/server';
import { db } from '../../Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateGroupDNA, getStrategyForActivity } from '../../../lib/groupDNA';

// Mock API keys - in production these would be stored in Google Cloud Secret Manager
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'mock-key';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'mock-key';

export async function POST(request) {
  try {
    const body = await request.json();
    const { flow, ...params } = body;

    console.log('🎯 Activity Planner request:', { flow, params });

    // Route to appropriate handler based on flow type
    switch (flow) {
      case 'singleActivity':
        return await handleSingleActivity(params);
      case 'holiday':
        return await handleHolidayPlanning(params);
      case 'manualPoll':
        return await handleManualPoll(params);
      case 'createPoll':
        return await handleCreatePoll(params);
      default:
        return NextResponse.json(
          { error: 'Invalid flow type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Activity Planner error:', error);
    return NextResponse.json(
      { error: 'Failed to process activity planning request', details: error.message },
      { status: 500 }
    );
  }
}

async function handleSingleActivity(params) {
  const { activityType, budget, radius, groupSize, location = 'San Francisco' } = params;
  
  console.log('🍽️ Processing single activity request:', params);

  try {
    // Generate Group DNA for personalized recommendations
    const groupDNA = await generateGroupDNA(params.groupId || 'group-6');
    let finalParams = { activityType, budget, radius, groupSize, location };

    // Use Group DNA strategy if available
    if (groupDNA) {
      const strategy = getStrategyForActivity(activityType, groupDNA);
      if (strategy) {
        console.log('🧬 Using Group DNA strategy:', strategy.strategy);
        finalParams = {
          ...finalParams,
          budget: strategy.budget,
          radius: strategy.radius,
          groupDNATypes: strategy.activityTypes
        };
      }
    }

    // Generate AI suggestions with Group DNA context
    const suggestions = await generateActivitySuggestions(
      finalParams.activityType, 
      finalParams.budget, 
      finalParams.radius, 
      finalParams.location,
      finalParams.groupDNATypes
    );
    
    // Create poll with AI suggestions
    const pollData = {
      title: `AI Suggestions: ${activityType}`,
      description: `Based on your preferences: ${budget} budget, ${radius}km radius, ${groupSize} people`,
      type: "ai_suggestions",
      groupId: params.groupId || "group-6",
      groupName: params.groupName || "Food Enthusiasts",
      createdBy: params.userId || "current-user",
      createdByName: params.userName || "Current User",
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      totalVotes: 0,
      options: suggestions.map((suggestion, index) => ({
        id: `ai-option-${index + 1}`,
        title: suggestion.name,
        description: suggestion.description,
        imageUrl: suggestion.imageUrl,
        votes: 0,
        voters: []
      }))
    };

    // Add to polls collection
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);

    // Create message in group chat
    const messageData = {
      type: 'ai_suggestions',
      pollId: pollDoc.id,
      content: `🤖 AI Suggestions: ${activityType} - ${suggestions.length} options found`,
      senderId: params.userId || 'current-user',
      senderName: params.userName || 'Current User',
      timestamp: serverTimestamp(),
      groupId: params.groupId || 'group-6'
    };

    const messagesRef = collection(db, 'groups', params.groupId || 'group-6', 'messages');
    await addDoc(messagesRef, messageData);

    return NextResponse.json({
      success: true,
      pollId: pollDoc.id,
      suggestions: suggestions,
      message: 'AI suggestions generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    throw new Error('Failed to generate AI suggestions');
  }
}

async function handleHolidayPlanning(params) {
  const { destination, startDate, endDate, groupSize, vibe } = params;
  
  console.log('✈️ Processing holiday planning request:', params);

  try {
    // Mock destination suggestions
    const destinations = await generateDestinationSuggestions(destination, vibe);
    
    return NextResponse.json({
      success: true,
      destinations: destinations,
      message: 'Holiday destinations generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating holiday suggestions:', error);
    throw new Error('Failed to generate holiday suggestions');
  }
}

async function handleManualPoll(params) {
  const { title, description, options, groupId, userId, userName } = params;
  
  console.log('📊 Processing manual poll creation:', params);

  try {
    const pollData = {
      title: title,
      description: description,
      type: "manual_poll",
      groupId: groupId,
      groupName: "Food Enthusiasts",
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      totalVotes: 0,
      options: options.map((option, index) => ({
        id: `manual-option-${index + 1}`,
        title: option.title,
        description: option.description,
        imageUrl: option.imageUrl,
        votes: 0,
        voters: []
      }))
    };

    // Add to polls collection
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);

    // Create message in group chat
    const messageData = {
      type: 'manual_poll',
      pollId: pollDoc.id,
      content: `📊 New Poll: ${title}`,
      senderId: userId,
      senderName: userName,
      timestamp: serverTimestamp(),
      groupId: groupId
    };

    const messagesRef = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesRef, messageData);

    return NextResponse.json({
      success: true,
      pollId: pollDoc.id,
      message: 'Manual poll created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating manual poll:', error);
    throw new Error('Failed to create manual poll');
  }
}

// Mock function to generate activity suggestions
async function generateActivitySuggestions(activityType, budget, radius, location, groupDNATypes = []) {
  // In production, this would call Google Places API with Group DNA context
  console.log('🤖 Generating suggestions with Group DNA types:', groupDNATypes);
  
  const suggestions = {
    'Food & Drink': [
      {
        name: "The Grand Bistro",
        description: "Upscale French bistro with seasonal menu and craft cocktails. Perfect for special occasions.",
      imageUrl: undefined
      },
      {
        name: "Sakura Sushi Bar",
        description: "Authentic Japanese sushi and sashimi, fresh daily. Omakase experience available.",
      imageUrl: undefined
      },
      {
        name: "La Piazza Trattoria",
        description: "Family-owned Italian restaurant with homemade pasta and wood-fired pizzas.",
      imageUrl: undefined
      }
    ],
    'Outdoors & Adventure': [
      {
        name: "Golden Gate Park Hiking",
        description: "Scenic trails with stunning city views. Perfect for nature lovers and photography.",
      imageUrl: undefined
      },
      {
        name: "Alcatraz Night Tour",
        description: "Spooky evening tour of the infamous prison island. Historical and thrilling.",
      imageUrl: undefined
      },
      {
        name: "Bay Area Kayaking",
        description: "Paddle through the beautiful San Francisco Bay with expert guides.",
      imageUrl: undefined
      }
    ],
    'Creative & Arts': [
      {
        name: "SFMOMA Art Workshop",
        description: "Create your own masterpiece inspired by modern art collections.",
      imageUrl: undefined
      },
      {
        name: "Pottery Studio Session",
        description: "Learn to throw clay and create beautiful ceramic pieces.",
      imageUrl: undefined
      },
      {
        name: "Street Photography Walk",
        description: "Capture the vibrant culture of San Francisco with professional guidance.",
      imageUrl: undefined
      }
    ]
  };

  // Return suggestions based on activity type, or default to Food & Drink
  return suggestions[activityType] || suggestions['Food & Drink'];
}

// Mock function to generate destination suggestions
async function generateDestinationSuggestions(destination, vibe) {
  return [
    {
      name: "Paris, France",
      description: "The City of Light offers romance, culture, and incredible cuisine.",
      matchScore: 95,
      imageUrl: undefined
    },
    {
      name: "Tokyo, Japan",
      description: "A perfect blend of traditional culture and modern innovation.",
      matchScore: 88,
      imageUrl: undefined
    },
    {
      name: "Barcelona, Spain",
      description: "Vibrant culture, stunning architecture, and Mediterranean charm.",
      matchScore: 82,
      imageUrl: undefined
    }
  ];

  return destinations;
}

async function handleCreatePoll(params) {
  const { suggestions, activityType, groupId, userId, userName } = params;
  
  console.log('📊 Creating poll from approved suggestions:', params);

  try {
    const pollData = {
      title: `${activityType} Activity Poll`,
      description: `AI-generated suggestions for ${activityType} activities`,
      type: "ai_suggestions",
      groupId: groupId,
      groupName: "Activity Group", // TODO: Get actual group name
      createdBy: userId || "current-user",
      createdByName: userName || "Current User",
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      totalVotes: 0,
      options: suggestions.map((suggestion, index) => ({
        id: `ai-option-${index + 1}`,
        title: suggestion.name,
        description: suggestion.description,
        imageUrl: suggestion.imageUrl,
        votes: 0,
        voters: []
      }))
    };

    // Add to polls collection
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);

    // Create message in group chat
    const messageData = {
      type: 'ai_suggestions',
      pollId: pollDoc.id,
      content: `🤖 AI Activity Poll: ${activityType} - ${suggestions.length} options`,
      senderId: userId || 'current-user',
      senderName: userName || 'Current User',
      timestamp: serverTimestamp(),
      groupId: groupId
    };

    const messagesRef = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesRef, messageData);

    return NextResponse.json({
      success: true,
      pollId: pollDoc.id,
      message: 'AI suggestions poll created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating poll:', error);
    throw new Error('Failed to create poll');
  }
} 