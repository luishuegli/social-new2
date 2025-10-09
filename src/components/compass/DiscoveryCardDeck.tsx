'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatchResult } from '@/app/types/firestoreSchema';
import StoryCard from './StoryCard';

interface DiscoveryCardDeckProps {
  matches: MatchResult[];
  onSwipe: (targetId: string, action: 'connect' | 'skip') => void;
  connectionTokens: number;
}

export default function DiscoveryCardDeck({ 
  matches, 
  onSwipe,
  connectionTokens 
}: DiscoveryCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const currentMatch = matches[currentIndex];
  const hasMoreMatches = currentIndex < matches.length - 1;

  const handleAction = useCallback((action: 'connect' | 'skip') => {
    if (isTransitioning || !currentMatch) return;

    setIsTransitioning(true);
    setExitDirection(action === 'connect' ? 'right' : 'left');

    // Call the onSwipe callback
    onSwipe(currentMatch.profile.uid!, action);

    // Wait for animation to complete before showing next card
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsTransitioning(false);
      setExitDirection(null);
    }, 300);
  }, [currentMatch, isTransitioning, onSwipe]);

  const handleConnect = useCallback((targetId: string, message?: string) => {
    handleAction('connect');
  }, [handleAction]);

  const handleSkip = useCallback(() => {
    handleAction('skip');
  }, [handleAction]);

  if (!currentMatch) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-400">No more profiles to discover right now</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Card Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMatch.profile.uid}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            x: exitDirection === 'right' ? 100 : exitDirection === 'left' ? -100 : 0,
            transition: { duration: 0.3 }
          }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl mx-auto"
        >
          <StoryCard
            match={currentMatch}
            onConnect={handleConnect}
            onSkip={handleSkip}
            connectionTokens={connectionTokens}
            isTopCard={true}
            isAnimating={isTransitioning}
            isDailyTopPick={currentIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicator */}
      {matches.length > 1 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {matches.length} profiles
          </p>
          <div className="flex justify-center gap-1.5 mt-3">
            {matches.slice(0, Math.min(matches.length, 10)).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-accent-primary'
                    : index < currentIndex
                    ? 'w-1.5 bg-gray-400 dark:bg-gray-600'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
            {matches.length > 10 && (
              <span className="text-xs text-gray-500 ml-2">+{matches.length - 10}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
