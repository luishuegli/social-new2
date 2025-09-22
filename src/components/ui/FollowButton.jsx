'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function FollowButton({ targetUserId, size = 'medium' }) {
  const { user } = useAuth();
  const [followState, setFollowState] = useState({
    isFollowing: false,
    isLoading: false,
    followersCount: 0
  });

  // Don't show follow button for own profile
  if (!targetUserId || user?.uid === targetUserId) {
    return null;
  }

  const loadFollowStatus = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/follow?targetUserId=${encodeURIComponent(targetUserId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setFollowState(prev => ({
          ...prev,
          isFollowing: result.isFollowing,
          followersCount: result.followersCount
        }));
      }
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  useEffect(() => {
    loadFollowStatus();
  }, [targetUserId, user?.uid]);

  const handleFollowToggle = async () => {
    if (!user || followState.isLoading) return;

    const newAction = followState.isFollowing ? 'unfollow' : 'follow';
    
    setFollowState(prev => ({
      ...prev,
      isLoading: true
    }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId,
          action: newAction
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setFollowState(prev => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.followersCount + (newAction === 'follow' ? 1 : -1),
          isLoading: false
        }));
      } else {
        throw new Error(result.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'w-3 h-3';
      case 'large':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleFollowToggle}
      disabled={followState.isLoading}
      className={`
        ${getSizeClasses()}
        flex items-center space-x-2 rounded-lg font-semibold transition-all duration-200
        ${followState.isFollowing 
          ? 'bg-background-secondary text-content-primary border border-border-separator hover:bg-background-tertiary' 
          : 'bg-accent-primary text-white hover:bg-accent-secondary'
        }
        ${followState.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {followState.isLoading ? (
        <div className={`${getIconSize()} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : followState.isFollowing ? (
        <>
          <UserCheck className={getIconSize()} />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className={getIconSize()} />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
}
