// src/app/api/debug-voting/route.js
import { db } from '../../Lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔍 Debugging voting system...');
    
    // Get all polls
    const pollsRef = collection(db, 'polls');
    const pollsSnapshot = await getDocs(pollsRef);
    
    const polls = [];
    pollsSnapshot.forEach((doc) => {
      const data = doc.data();
      polls.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log('📊 Found polls:', polls.length);
    
    // Get the most recent poll for group-6
    const group6Polls = polls.filter(poll => poll.groupId === 'group-6');
    const latestPoll = group6Polls.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.seconds - a.createdAt.seconds;
    })[0];
    
    if (!latestPoll) {
      return Response.json({ 
        success: false, 
        error: 'No polls found for group-6',
        totalPolls: polls.length,
        groupPolls: group6Polls.length
      });
    }
    
    console.log('🎯 Latest poll for group-6:', latestPoll);
    
    // Check voting status for test user
    const testUserId = 'w3sBDWp9pGN1GcZhmbFQo6V8S7y1'; // From the debug info
    const hasVoted = latestPoll.options.some(option => 
      option.voters && option.voters.includes(testUserId)
    );
    
    const userVotedOption = latestPoll.options.find(option => 
      option.voters && option.voters.includes(testUserId)
    );
    
    console.log('🔍 Voting analysis:', {
      userId: testUserId,
      hasVoted,
      userVotedOption: userVotedOption?.title,
      allVoters: latestPoll.options.map(o => ({ option: o.title, voters: o.voters }))
    });
    
    return Response.json({ 
      success: true, 
      message: 'Voting debug completed',
      results: {
        pollId: latestPoll.id,
        pollTitle: latestPoll.title,
        userId: testUserId,
        hasVoted,
        userVotedOption: userVotedOption?.title,
        totalVotes: latestPoll.totalVotes,
        options: latestPoll.options.map(o => ({
          title: o.title,
          votes: o.votes,
          voters: o.voters
        })),
        allPolls: polls.length,
        groupPolls: group6Polls.length
      }
    });
    
  } catch (error) {
    console.error('❌ Voting debug failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 