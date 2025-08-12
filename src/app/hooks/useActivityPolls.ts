'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { recordVoteHistory } from '../../lib/aiVotingHistory';

// Define the types for our poll data
interface PollOption {
  id: string;
  title: string;
  description: string;
  votes: number;
  voters: string[];
}

interface ActivityPoll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  groupId: string;
  createdBy: string;
  createdByName: string;
  createdAt: any;
  isActive: boolean;
  type: string;
  totalVotes: number;
}

export function useActivityPolls() {
  const [polls, setPolls] = useState<ActivityPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🎯 Setting up polls listener...');
    // If logged out, clear state and stop listening
    if (!user) {
      setPolls([]);
      setLoading(false);
      return;
    }

    try {
      // Create simple query to get all polls (no index required)
      const pollsRef = collection(db, 'polls');
      // Set up real-time listener
      const unsubscribe = onSnapshot(pollsRef, 
        (snapshot) => {
          console.log('🔥 Polls snapshot received, docs:', snapshot.docs.length);
          
          const pollsData: ActivityPoll[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only include active polls
            if (data.isActive === true) {
              pollsData.push({
                id: doc.id,
                ...data
              } as ActivityPoll);
            }
          });

          // Sort by creation date (newest first)
          pollsData.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.seconds - a.createdAt.seconds;
          });

          console.log('📊 Polls loaded:', pollsData);
          setPolls(pollsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error loading polls:', err);
          setError('Failed to load polls');
          setLoading(false);
        }
      );

      return () => {
        console.log('🧹 Cleaning up polls listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up polls listener:', err);
      setError('Failed to connect to polls');
      setLoading(false);
    }
  }, [user]);

  const handleVote = useCallback(async (pollId: string, optionId: string, userId: string) => {
    try {
      console.log('🗳️ Voting on poll:', { pollId, optionId, userId });
      
      if (!pollId || !optionId || !userId) {
        console.error('❌ Missing required parameters:', { pollId, optionId, userId });
        throw new Error('Poll ID, option ID, and user ID are required for voting');
      }
      
      console.log('🔍 Looking for poll with ID:', pollId);
      
      const pollRef = doc(db, 'polls', pollId);
      
      // First try to find poll in local state
      let poll = polls.find(p => p.id === pollId);
      
      // If not found in local state, fetch it directly from Firestore
      if (!poll) {
        console.log('🔍 Poll not in local state, fetching from Firestore...');
        const pollDoc = await getDoc(pollRef);
        if (pollDoc.exists()) {
          poll = { id: pollDoc.id, ...pollDoc.data() } as ActivityPoll;
          console.log('✅ Found poll in Firestore:', poll);
        } else {
          console.error('❌ Poll not found in Firestore');
          throw new Error('Poll not found');
        }
      } else {
        console.log('✅ Found poll in local state:', poll);
      }

      // Check if user has already voted on this poll
      const hasVoted = poll.options.some(option => 
        option.voters && option.voters.includes(userId)
      );
      
      console.log('🔍 User vote check:', { userId, hasVoted, voters: poll.options.map(o => o.voters) });
      
      if (hasVoted) {
        console.log('❌ User has already voted');
        throw new Error('You have already voted on this poll');
      }

      // Get the selected option title for vote history
      const selectedOption = poll.options.find(opt => opt.id === optionId);
      if (!selectedOption) {
        console.error('❌ Selected option not found:', optionId);
        throw new Error('Selected option not found');
      }

      console.log('✅ Selected option:', selectedOption);

      // Update the poll with the vote
      const updatedOptions = poll.options.map(option => {
        if (option.id === optionId) {
          return {
            ...option,
            votes: (option.votes || 0) + 1,
            voters: [...(option.voters || []), userId]
          };
        }
        return option;
      });

      console.log('📝 Updating poll in Firestore...');
      console.log('📝 Updated options:', updatedOptions);
      
      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: (poll.totalVotes || 0) + 1
      });

      console.log('✅ Poll updated in Firestore successfully');

      // Record vote history for AI suggestions
      console.log('📊 Recording vote history...');
      await recordVoteHistory(pollId, selectedOption.title, userId, poll.groupId);

      console.log('✅ Vote submitted successfully');
    } catch (err: any) {
      console.error('❌ Error voting:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      // Return a user-friendly error message
      const errorMessage = err.message || 'Failed to vote. Please try again.';
      throw new Error(errorMessage);
    }
  }, [polls]);

  return {
    polls,
    loading,
    error,
    handleVote
  };
}
