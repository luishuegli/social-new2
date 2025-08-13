'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Calendar, MapPin, Clock, Check } from 'lucide-react';
import { db } from '@/app/Lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import LiquidGlass from './ui/LiquidGlass';
import { useAuth } from '../app/contexts/AuthContext';

export default function ActivityPollCard({ poll, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();
  const handleFinalize = async () => {
    if (!user || user.uid !== poll.createdBy) return;
    await fetch('/api/finalize-poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pollId: poll.id }) });
    alert('Activity created from winning option.');
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleVote = async () => {
    if (selectedOption === null || !user) return;
    
    setIsVoting(true);
    try {
      const optionId = poll.options[selectedOption]?.id;
      console.log("🗳️ Attempting to vote:", { 
        pollId: poll.id, 
        optionId, 
        userId: user.uid 
      });
      
      await onVote?.(poll.id, optionId, user.uid);
      console.log("✅ Vote submitted successfully");
    } catch (error) {
      console.error('Failed to vote:', error);
      // Show user-friendly error message
      alert(error.message || 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
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

  const userVotedOption = getUserVotedOption();
  const userHasVoted = hasUserVoted();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <LiquidGlass className="p-4 mb-4">
        {/* Voting Status Banner */}
        {userHasVoted && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>You voted for "{userVotedOption?.title}"</span>
            </div>
          </div>
        )}

        {/* Group Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
            {poll.groupName || poll.groupId ? (
              <span className="text-sm font-semibold text-content-primary">
                {(poll.groupName || poll.groupId || "G").charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="text-sm font-semibold text-content-primary">
                G
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-content-primary">
              {poll.groupName || poll.groupId || "Unknown Group"}
            </h3>
            <p className="text-xs text-content-secondary">Activity Planning</p>
          </div>
        </div>

        {/* Poll Question */}
        <div className="mb-4">
          <h4 className="text-lg font-bold text-content-primary mb-2 leading-tight">
            {poll.title}
          </h4>
          {poll.description && (
            <p className="text-sm text-content-secondary leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* Poll Options */}
        <div className="space-y-3 mb-4">
          {poll.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const percentage = getVotePercentage(option.votes || 0);
            const userVotedForThis = option.voters && option.voters.includes(user?.uid);
            
            return (
              <button
                key={index}
                onClick={() => !userHasVoted && setSelectedOption(index)}
                disabled={userHasVoted}
                className={`
                  w-full p-3 rounded-xl text-left transition-all duration-200 relative overflow-hidden
                  ${isSelected && !userHasVoted 
                    ? 'border-2 border-accent-primary bg-accent-primary/10' 
                    : 'border-2 border-border-separator hover:border-accent-primary/50'
                  }
                  ${userHasVoted ? 'cursor-default' : 'cursor-pointer'}
                  ${userVotedForThis ? 'border-2 border-green-400 bg-green-400/10' : ''}
                `}
              >
                {/* Vote percentage background */}
                {userHasVoted && (
                  <div 
                    className="absolute inset-0 bg-accent-primary/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-content-primary">
                        {option.title}
                      </p>
                      {userVotedForThis && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    {option.details && (
                      <div className="flex items-center space-x-4 text-sm text-content-secondary mt-1">
                        {option.details.date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(option.details.date)}</span>
                          </div>
                        )}
                        {option.details.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{option.details.location}</span>
                          </div>
                        )}
                        {option.details.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{option.details.duration}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm font-semibold text-content-primary ml-3">
                    {userHasVoted ? `${percentage}%` : `${option.votes || 0} votes`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Poll Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border-separator">
          <div className="flex items-center space-x-4 text-sm text-content-secondary">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{getTotalVotes()} votes</span>
            </div>
          {poll.expiresAt && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Ends {formatDate(poll.expiresAt)}</span>
              </div>
            )}
          {poll.status === 'active' && poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now() && user?.uid === poll.createdBy && (
            <button onClick={handleFinalize} className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/40">Finalize (time elapsed)</button>
          )}
          </div>
          
          <div className="flex items-center space-x-2">
          {!userHasVoted ? (
            <button
              onClick={handleVote}
              disabled={selectedOption === null || isVoting}
              className={`
                px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center space-x-2
                ${selectedOption !== null && !isVoting
                  ? 'bg-accent-primary text-content-primary hover:bg-opacity-90'
                  : 'bg-background-secondary text-content-secondary cursor-not-allowed'
                }
              `}
            >
              {isVoting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full"></div>
                  <span>Voting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Vote</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <Check className="w-4 h-4" />
              <span>Vote recorded</span>
            </div>
          )}
          {poll.status !== 'closed' && user?.uid === poll.createdBy && (
            <button
              onClick={handleFinalize}
              className="px-4 py-2 rounded-full font-medium bg-green-600 text-white hover:bg-green-700"
            >
              Choose Winning Activity
            </button>
          )}
          </div>
        </div>
      </LiquidGlass>
    </motion.div>
  );
}