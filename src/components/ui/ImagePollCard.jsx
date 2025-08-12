'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, User, Vote, Heart } from 'lucide-react';
import { useAuth } from '../../app/contexts/AuthContext';

export default function ImagePollCard({ poll, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const { user } = useAuth();

  const handleOptionSelect = (optionId) => {
    if (!hasVoted) {
      setSelectedOption(optionId);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !user || hasVoted) {
      return;
    }
    
    setIsVoting(true);
    try {
      await onVote(poll.id, selectedOption, user.uid);
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
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
    return poll.options.reduce((total, option) => total + (option.votes || 0), 0);
  };

  const getVotePercentage = (votes) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const hasUserVoted = () => {
    if (!user) return false;
    return poll.options.some(option => 
      option.voters && option.voters.includes(user.uid)
    );
  };

  const getUserVotedOption = () => {
    if (!user) return null;
    return poll.options.find(option => 
      option.voters && option.voters.includes(user.uid)
    );
  };

  // If poll has no ID, show an error message
  if (!poll.id) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md">
        <p className="text-red-200 text-sm">⚠️ This poll is missing an ID and cannot be voted on.</p>
      </div>
    );
  }

  const userVotedOption = getUserVotedOption();
  const userHasVoted = hasUserVoted();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-md"
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
      <div className="flex items-center space-x-2 mb-3 p-4 pb-0">
        <CheckSquare className="w-4 h-4 text-white/70" />
        <h3 className="text-sm font-semibold text-white">Activity Poll: {poll.title}</h3>
      </div>

      {/* Poll Creator Info */}
      <div className="flex items-center space-x-2 mb-4 px-4">
        <User className="w-3 h-3 text-white/50" />
        <span className="text-xs text-white/50">
          Posted by {poll.createdByName} at {formatTimestamp(poll.createdAt)}
        </span>
      </div>

      {/* Poll Options */}
      <div className="space-y-3 px-4">
        {poll.options.map((option) => {
          const percentage = getVotePercentage(option.votes || 0);
          const isSelected = selectedOption === option.id;
          const userVotedForThis = option.voters && option.voters.includes(user?.uid);
          
          return (
            <motion.button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={userHasVoted}
              className={`w-full text-left transition-all duration-200 ${
                userHasVoted
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-white/20'
              } ${
                userVotedForThis
                  ? 'bg-green-500/20 border-2 border-green-400'
                  : isSelected && !userHasVoted
                    ? 'bg-white/30 border border-white/40'
                    : 'bg-white/10 border border-white/20'
              } rounded-lg overflow-hidden`}
            >
              {/* Option Image */}
              {option.imageUrl && (
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={option.imageUrl}
                    alt={option.title}
                    className="w-full h-full object-cover"
                  />
                  {userVotedForThis && (
                    <div className="absolute top-2 right-2 p-1 bg-green-500/80 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Option Content */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">{option.title}</h4>
                    {option.description && (
                      <p className="text-xs text-white/70 line-clamp-2">{option.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/70">{option.votes || 0} votes</span>
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
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Vote Button or Status */}
      <div className="p-4 pt-3">
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
      </div>
    </motion.div>
  );
} 