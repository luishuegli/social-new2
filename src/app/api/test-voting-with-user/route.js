// src/app/api/test-voting-with-user/route.js
import { db } from '../../Lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🧪 Testing voting with simulated user...');
    
    // Simulate a logged-in user
    const testUserId = 'test-user-123';
    
    // 1. Create a test poll
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
    
    // 2. Try to vote on the poll with the simulated user
    const pollRef = doc(db, 'polls', pollDoc.id);
    
    // Check if user has already voted
    const currentPollDoc = await getDoc(pollRef);
    const currentPollData = currentPollDoc.data();
    
    const hasVoted = currentPollData.options.some(option => 
      option.voters && option.voters.includes(testUserId)
    );
    
    if (hasVoted) {
      console.log('❌ User has already voted');
      return Response.json({ 
        success: false, 
        error: 'User has already voted on this poll',
        pollId: pollDoc.id,
        userId: testUserId
      });
    }
    
    // Update the poll with the vote
    const updatedOptions = currentPollData.options.map(option => {
      if (option.id === 'option_1') {
        return {
          ...option,
          votes: (option.votes || 0) + 1,
          voters: [...(option.voters || []), testUserId]
        };
      }
      return option;
    });
    
    console.log('📝 Attempting to update poll with user vote...');
    await updateDoc(pollRef, {
      options: updatedOptions,
      totalVotes: (currentPollData.totalVotes || 0) + 1
    });
    console.log('✅ Poll updated successfully with user vote');
    
    // 3. Verify the vote was recorded
    const updatedPollDoc = await getDoc(pollRef);
    const updatedPollData = updatedPollDoc.data();
    
    console.log('📊 Updated poll data:', {
      totalVotes: updatedPollData.totalVotes,
      option1Votes: updatedPollData.options[0].votes,
      option1Voters: updatedPollData.options[0].voters,
      userVoted: updatedPollData.options[0].voters.includes(testUserId)
    });
    
    return Response.json({ 
      success: true, 
      message: 'Voting test with user completed successfully!',
      results: {
        pollId: pollDoc.id,
        userId: testUserId,
        totalVotes: updatedPollData.totalVotes,
        option1Votes: updatedPollData.options[0].votes,
        option1Voters: updatedPollData.options[0].voters,
        userVoted: updatedPollData.options[0].voters.includes(testUserId),
        groupId: 'group-6',
        expiresIn: '60 seconds'
      }
    });
    
  } catch (error) {
    console.error('❌ Voting test with user failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 });
  }
} 