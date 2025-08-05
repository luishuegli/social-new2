'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Calendar, MapPin, Clock } from 'lucide-react';
import LiquidGlass from './ui/LiquidGlass';

export default function ActivityPollCard({ poll, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

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
    if (selectedOption === null || hasVoted) return;
    
    try {
      await onVote?.(poll.id, selectedOption);
      setHasVoted(true);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const getTotalVotes = () => {
    return poll.options.reduce((total, option) => total + (option.votes || 0), 0);
  };

  const getVotePercentage = (votes) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <LiquidGlass className="p-4 mb-4">
        {/* Group Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
            {poll.group.avatar ? (
              <Image
                src={poll.group.avatar}
                alt={poll.group.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-content-primary">
                {poll.group.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-content-primary">
              {poll.group.name}
            </h3>
            <p className="text-xs text-content-secondary">Activity Planning</p>
          </div>
        </div>

        {/* Poll Question */}
        <div className="mb-4">
          <h4 className="text-lg font-bold text-content-primary mb-2 leading-tight">
            {poll.question}
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
            
            return (
              <button
                key={index}
                onClick={() => !hasVoted && setSelectedOption(index)}
                disabled={hasVoted}
                className={`
                  w-full p-3 rounded-xl text-left transition-all duration-200 relative overflow-hidden
                  ${isSelected && !hasVoted 
                    ? 'border-2 border-accent-primary bg-accent-primary/10' 
                    : 'border-2 border-border-separator hover:border-accent-primary/50'
                  }
                  ${hasVoted ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                {/* Vote percentage background */}
                {hasVoted && (
                  <div 
                    className="absolute inset-0 bg-accent-primary/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-content-primary mb-1">
                      {option.title}
                    </p>
                    {option.details && (
                      <div className="flex items-center space-x-4 text-sm text-content-secondary">
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
                  
                  {hasVoted && (
                    <div className="text-sm font-semibold text-content-primary ml-3">
                      {percentage}%
                    </div>
                  )}
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
            {poll.deadline && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Ends {formatDate(poll.deadline)}</span>
              </div>
            )}
          </div>
          
          {!hasVoted && (
            <button
              onClick={handleVote}
              disabled={selectedOption === null}
              className={`
                px-4 py-2 rounded-full font-medium transition-all duration-200
                ${selectedOption !== null
                  ? 'bg-accent-primary text-content-primary hover:bg-opacity-90'
                  : 'bg-background-secondary text-content-secondary cursor-not-allowed'
                }
              `}
            >
              Vote
            </button>
          )}
        </div>
      </LiquidGlass>
    </motion.div>
  );
}