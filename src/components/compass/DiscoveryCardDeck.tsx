'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import { MatchResult, CoreInterest } from '@/app/types/firestoreSchema';
import StoryCard from './StoryCard';
import { ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(matches.length - 1);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentIndexRef = useRef(currentIndex);
  
  const childRefs = useMemo(
    () => Array(matches.length).fill(0).map(() => React.createRef<any>()),
    [matches.length]
  );

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = useCallback((direction: string, targetId: string, index: number) => {
    updateCurrentIndex(index - 1);
    const action = direction === 'right' ? 'connect' : 'skip';
    onSwipe(targetId, action);
  }, [onSwipe]);

  const outOfFrame = useCallback((name: string, idx: number) => {
    console.log(`${name} (${idx}) left the screen!`);
    setIsAnimating(false);
  }, []);

  const swipe = useCallback(async (dir: 'left' | 'right') => {
    if (canSwipe && currentIndex < matches.length && !isAnimating) {
      setIsAnimating(true);
      await childRefs[currentIndex].current?.swipe(dir);
    }
  }, [canSwipe, currentIndex, matches.length, isAnimating, childRefs]);

  const handleConnect = useCallback((targetId: string, message?: string) => {
    // This would trigger the connect swipe with a pre-filled message
    swipe('right');
    // In a real implementation, you'd also send the message with the connection request
  }, [swipe]);

  const handleSkip = useCallback(() => {
    swipe('left');
  }, [swipe]);

  return (
    <div className="mt-8">
      {/* Card Stack */}
      <div className="relative h-[600px] flex items-center justify-center">
        {matches.map((match, index) => (
          <TinderCard
            ref={childRefs[index]}
            className="absolute w-full max-w-2xl"
            key={`${match.profile.uid || 'unknown'}-${index}`}
            onSwipe={(dir) => swiped(dir, match.profile.uid!, index)}
            onCardLeftScreen={() => outOfFrame(match.profile.username || 'User', index)}
            preventSwipe={['up', 'down']}
          >
            <div 
              style={{ 
                display: index === currentIndex ? 'block' : 'none',
              }}
            >
              <StoryCard
                match={match}
                onConnect={handleConnect}
                onSkip={handleSkip}
                onSwipeRight={() => swipe('right')}
                connectionTokens={connectionTokens}
                isTopCard={index === currentIndex}
                canSwipe={canSwipe}
                isAnimating={isAnimating}
                isDailyTopPick={index === 0}
              />
            </div>
          </TinderCard>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>Swipe right to connect • Swipe left to skip</p>
      </div>
    </div>
  );
}
