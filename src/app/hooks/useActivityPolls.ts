'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockActivityPolls } from '../utils/mockConversations';

// Define the types for our poll data
interface PollOption {
  title: string;
  votes: number;
}

interface ActivityPoll {
  id: string;
  question: string;
  options: PollOption[];
  groupName: string;
  activityTitle: string;
}

export function useActivityPolls() {
  const [polls, setPolls] = useState<ActivityPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchPolls = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Filter out polls where user has already voted (in a real app, this would be server-side)
        // For demo purposes, we're showing all polls
        const activePolls: ActivityPoll[] = mockActivityPolls.map(poll => ({
          id: poll.id,
          question: poll.question,
          groupName: poll.group.name,
          activityTitle: poll.question, // Or some other mapping
          options: poll.options.map(option => ({
            title: option.title,
            votes: option.votes
          }))
        }));
        
        setPolls(activePolls);
        setError(null);
      } catch (err) {
        setError('Failed to load activity polls');
        console.error('Error fetching polls:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const handleVote = useCallback(async (pollId: string, optionIndex: number) => {
    try {
      console.log('Voting on poll:', pollId, 'option:', optionIndex);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the poll with the new vote
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map((option, index) => {
            if (index === optionIndex) {
              return { ...option, votes: (option.votes || 0) + 1 };
            }
            return option;
          });
          return { ...poll, options: updatedOptions };
        }
        return poll;
      }));
      
      // In a real app, you would make an API call here
      // await api.votePoll(pollId, optionIndex);
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError('Failed to submit vote');
    }
  }, []);

  return {
    polls,
    loading,
    error,
    handleVote
  };
}