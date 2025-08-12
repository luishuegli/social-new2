'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, User, Vote } from 'lucide-react';
import { useAuth } from '../../app/contexts/AuthContext';

export default function ChatPollCard({ poll, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();

  console.log('🔍 ChatPollCard received poll:', poll);
  console.log('🔍 Current user:', user);
  console.log('🔍 User ID:', user?.uid);
  console.log('🔍 User email:', user?.email);

  const handleOptionSelect = (optionId) => {
    console.log('🎯 Option selected:', optionId);
    setSelectedOption(optionId);
  };

  const handleVote = async () => {
    console.log('🗳️ Starting vote process...');
    console.log('🗳️ Selected option:', selectedOption);
    console.log('🗳️ User:', user);
    console.log('🗳️ User ID:', user?.uid);
    
    if (!selectedOption || !user) {
      console.log('❌ Cannot vote:', { selectedOption, user });
      if (!selectedOption) {
        alert('Please select an option to vote for.');
      } else if (!user) {
        alert('Please log in to vote.');
      }
      return;
    }
    
    // Check if poll has an ID
    if (!poll.id) {
      console.error('❌ Poll has no ID:', poll);
      alert('Cannot vote: Poll ID is missing');
      return;
    }
    
    setIsVoting(true);
    try {
      console.log('🗳️ Attempting to vote:', { pollId: poll.id, optionId: selectedOption, userId: user.uid });
      await onVote(poll.id, selectedOption, user.uid);
      console.log('✅ Vote submitted successfully');
    } catch (error) {
      console.error('❌ Error voting:', error);
      alert(`Failed to vote: ${error.message || 'Please try again.'}`);
    } finally {
      setIsVoting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTotalVotes = () => {
    return poll.options.reduce((total, option) => total + option.votes, 0);
  };

  const getVotePercentage = (votes) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const hasUserVoted = () => {
    if (!user) return false;
    const voted = poll.options.some(option => option.voters.includes(user?.uid));
    console.log('🔍 User voted check:', { userId: user?.uid, voted, voters: poll.options.map(o => o.voters) });
    return voted;
  };

  const getUserVotedOption = () => {
    if (!user) return null;
    return poll.options.find(option => option.voters.includes(user?.uid));
  };

  // If poll has no ID, show an error message
  if (!poll.id) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md">
        <p className="text-red-200 text-sm">⚠️ This poll is missing an ID and cannot be voted on.</p>
        <p className="text-red-300 text-xs mt-2">Poll data: {JSON.stringify(poll, null, 2)}</p>
      </div>
    );
  }

  // Show voting status at the top
  const userVotedOption = getUserVotedOption();
  const userHasVoted = hasUserVoted();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-md"
    >
      {/* Voting Status Banner */}
      {userHasVoted && (
        <div className="mb-3 p-2 bg-green-500/20 border border-green-400/30 rounded-lg">
          <div className="flex items-center space-x-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>You voted for "{userVotedOption?.title}"</span>
          </div>
        </div>
      )}

      {/* Poll Header */}
      <div className="flex items-center space-x-2 mb-3">
        <CheckSquare className="w-4 h-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white">Activity Poll: {poll.title}</h3>
      </div>

      {/* Poll Creator Info */}
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-3 h-3 text-white/50" />
        <span className="text-xs text-white/50">
          Posted by {poll.createdByName} at {formatTimestamp(poll.createdAt)}
        </span>
      </div>

      {/* Poll Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map((option) => {
          const percentage = getVotePercentage(option.votes);
          const isSelected = selectedOption === option.id;
          const userVotedForThis = option.voters.includes(user?.uid);
          
          return (
            <motion.button
              key={option.id}
              onClick={() => !userHasVoted && handleOptionSelect(option.id)}
              disabled={userHasVoted}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                userHasVoted
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-white/20'
              } ${
                isSelected && !userHasVoted
                  ? 'bg-white/30 border border-white/40'
                  : 'bg-white/10 border border-white/20'
              } ${
                userVotedForThis
                  ? 'bg-green-500/20 border-green-400/40'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white">{option.title}</p>
                    {userVotedForThis && (
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-white/70 mt-1">{option.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-white/70">{option.votes} votes</span>
                  {userHasVoted && (
                    <span className="text-xs text-green-400">
                      {percentage}%
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress bar for voted polls */}
              {userHasVoted && (
                <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-green-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Vote Button or Status */}
      {!userHasVoted ? (
        <div className="flex items-center justify-between">
          <button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedOption && !isVoting
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-400/40'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span className="text-sm">
              {isVoting ? 'Voting...' : 'Vote'}
            </span>
          </button>
          
          <div className="flex items-center space-x-1 text-xs text-white/50">
            <Clock className="w-3 h-3" />
            <span>Vote ends in 60 seconds</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Total votes: {getTotalVotes()}</span>
          <span>Poll active</span>
        </div>
      )}
    </motion.div>
  );
} 