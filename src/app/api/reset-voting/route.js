// src/app/api/reset-voting/route.js
import { db } from '../../Lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔄 Resetting voting state...');
    
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
    
    // Get the most recent poll for group-6
    const group6Polls = polls.filter(poll => poll.groupId === 'group-6');
    const latestPoll = group6Polls.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.seconds - a.createdAt.seconds;
    })[0];
    
    if (!latestPoll) {
      return Response.json({ 
        success: false, 
        error: 'No polls found for group-6'
      });
    }
    
    console.log('🎯 Resetting votes for poll:', latestPoll.id);
    
    // Reset votes by removing all voters
    const resetOptions = latestPoll.options.map(option => ({
      ...option,
      votes: 0,
      voters: []
    }));
    
    // Update the poll
    const pollRef = doc(db, 'polls', latestPoll.id);
    await updateDoc(pollRef, {
      options: resetOptions,
      totalVotes: 0
    });
    
    console.log('✅ Voting state reset successfully');
    
    return Response.json({ 
      success: true, 
      message: 'Voting state reset successfully',
      results: {
        pollId: latestPoll.id,
        pollTitle: latestPoll.title,
        resetOptions: resetOptions.map(o => ({
          title: o.title,
          votes: o.votes,
          voters: o.voters
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Reset voting failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 