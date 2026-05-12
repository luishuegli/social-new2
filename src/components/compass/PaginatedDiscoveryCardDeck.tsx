'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatchResult, UserProfile } from '@/app/types/firestoreSchema';
import StoryCard from './StoryCard';
import ProfilePreviewModal from './ProfilePreviewModal';
import { usePaginatedDiscovery } from '@/hooks/usePaginatedDiscovery';
import { InfiniteScrollTrigger } from '@/components/common/PaginationTrigger';

interface PaginatedDiscoveryCardDeckProps {
  onSwipe: (targetId: string, action: 'connect' | 'skip', message?: string) => void;
  connectionTokens: number;
  interestFilter?: string;
  locationRadius?: number;
  searchQuery?: string;
}

export default function PaginatedDiscoveryCardDeck({ 
  onSwipe,
  connectionTokens,
  interestFilter,
  locationRadius,
  searchQuery
}: PaginatedDiscoveryCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
  const [selectedMatchScore, setSelectedMatchScore] = useState<number>(0);

  const {
    matches,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    triggerRef
  } = usePaginatedDiscovery({
    interestFilter,
    locationRadius,
    searchQuery,
    enableInfiniteScroll: true
  });

  const currentConnection = matches[currentIndex];
  const hasMoreConnections = currentIndex < matches.length - 1 || hasMore;

  const handleAction = useCallback((action: 'connect' | 'skip', message?: string) => {
    if (isTransitioning || !currentConnection) return;

    setIsTransitioning(true);
    setExitDirection(action === 'connect' ? 'right' : 'left');

    // Call the onSwipe callback with message
    onSwipe(currentConnection.profile.uid!, action, message);

    // Wait for animation to complete before showing next card
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsTransitioning(false);
      setExitDirection(null);
      
      // Load more connections if we're running low
      if (currentIndex >= matches.length - 2 && hasMore && !loading) {
        loadMore();
      }
    }, 300);
  }, [currentConnection, isTransitioning, onSwipe, currentIndex, matches.length, hasMore, loading, loadMore]);

  const handleConnect = useCallback((targetId: string, message?: string) => {
    handleAction('connect', message);
  }, [handleAction]);

  const handleSkip = useCallback(() => {
    handleAction('skip');
  }, [handleAction]);

  const handleViewProfile = useCallback((user: UserProfile, matchScore: number) => {
    setSelectedUser(user);
    setSelectedMatchScore(matchScore);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedUser(null);
    setSelectedMatchScore(0);
  }, []);

  const handleModalConnect = useCallback((userId: string, message?: string) => {
    handleConnect(userId, message);
    handleCloseModal();
  }, [handleConnect, handleCloseModal]);

  // Show loading state for initial load
  if (loading && matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Finding suitable connections...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-red-600">Error loading matches</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={refresh}
            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No more matches</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've seen all available matches. Check back later for new connections!
          </p>
          <button
            onClick={refresh}
            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {currentConnection && (
            <motion.div
              key={currentConnection.profile.uid}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: exitDirection === 'left' ? -300 : exitDirection === 'right' ? 300 : 0,
                opacity: 0,
                scale: 0.8
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative"
            >
              <StoryCard
                match={currentConnection}
                onConnect={handleConnect}
                onSkip={handleSkip}
                connectionTokens={connectionTokens}
                onViewProfile={() => handleViewProfile(currentConnection.profile, currentConnection.score)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection tokens indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
            <span className="text-white text-sm font-medium">
              {connectionTokens} connections left
            </span>
          </div>
        </div>
      </div>

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        triggerRef={triggerRef}
        loading={loading}
        hasMore={hasMore}
      />

      {/* Profile Preview Modal */}
      {selectedUser && (
        <ProfilePreviewModal
          user={selectedUser as UserProfile}
          matchScore={selectedMatchScore}
          sharedInterests={currentConnection?.sharedInterests || []}
          onConnect={handleModalConnect}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
