'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface LikeState {
  count: number;
  isLiked: boolean;
  isLoading: boolean;
}

export function useInstagramLike(postId: string, initialCount: number = 0, initialIsLiked: boolean = false) {
  const { user, firebaseUser } = useAuth();
  const [likeState, setLikeState] = useState<LikeState>({
    count: initialCount,
    isLiked: initialIsLiked,
    isLoading: false
  });

  // Fetch the user's like status when component mounts
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!firebaseUser || !postId) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/user-likes?postId=${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const isLiked = result.isLiked || false;
          const likeCount = result.likeCount || 0;
          
          setLikeState(prev => ({
            ...prev,
            isLiked,
            count: likeCount
          }));
        }
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };

    fetchLikeStatus();
  }, [postId, firebaseUser]);

  const toggleLike = useCallback(async () => {
    if (!firebaseUser || likeState.isLoading) return;

    const newIsLiked = !likeState.isLiked;
    const newCount = likeState.count + (newIsLiked ? 1 : -1);

    // Optimistic update
    setLikeState(prev => ({
      ...prev,
      isLoading: true,
      isLiked: newIsLiked,
      count: newCount
    }));

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/like-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          isLiked: newIsLiked
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update like');
      }

      // Update with server response
      setLikeState(prev => ({
        ...prev,
        count: result.newLikeCount,
        isLiked: result.isLiked,
        isLoading: false
      }));

      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      setLikeState(prev => ({
        ...prev,
        isLiked: !newIsLiked,
        count: likeState.count,
        isLoading: false
      }));

      throw error;
    }
  }, [firebaseUser, postId, likeState.isLoading, likeState.isLiked, likeState.count]);

  const updateLikeState = useCallback((count: number, isLiked: boolean) => {
    setLikeState(prev => ({
      ...prev,
      count,
      isLiked,
      isLoading: false
    }));
  }, []);

  return {
    likeState,
    toggleLike,
    updateLikeState
  };
}