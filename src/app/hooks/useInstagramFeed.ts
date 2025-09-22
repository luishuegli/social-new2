'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface InstagramPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  username: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  postType: 'Collaborative' | 'Individual';
  authenticityType: 'Live Post' | 'Later Post';
  groupId?: string;
  groupName?: string;
  activityId?: string;
}

export interface FeedState {
  posts: InstagramPost[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useInstagramFeed() {
  const { user } = useAuth();
  const [feedState, setFeedState] = useState<FeedState>({
    posts: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true
  });

  const loadFeed = useCallback(async (refresh = false) => {
    if (!user) return;

    if (refresh) {
      setFeedState(prev => ({ ...prev, isLoading: true, error: null }));
    } else {
      setFeedState(prev => ({ ...prev, isLoadingMore: true, error: null }));
    }

    try {
      const token = await user.getIdToken();
      const lastPostId = refresh ? '' : feedState.posts[feedState.posts.length - 1]?.id;
      
      const url = new URL('/api/posts/feed', window.location.origin);
      url.searchParams.set('limit', '10');
      if (lastPostId) {
        url.searchParams.set('lastPostId', lastPostId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load feed');
      }

      const newPosts = result.posts || [];

      setFeedState(prev => ({
        ...prev,
        posts: refresh ? newPosts : [...prev.posts, ...newPosts],
        isLoading: false,
        isLoadingMore: false,
        hasMore: result.hasMore || false,
        error: null
      }));

    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: error.message || 'Failed to load feed'
      }));
    }
  }, [user, feedState.posts]);

  const refreshFeed = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!feedState.isLoadingMore && feedState.hasMore) {
      loadFeed(false);
    }
  }, [loadFeed, feedState.isLoadingMore, feedState.hasMore]);

  // Load initial feed
  useEffect(() => {
    if (user && feedState.posts.length === 0 && !feedState.isLoading) {
      loadFeed(true);
    }
  }, [user, loadFeed, feedState.posts.length, feedState.isLoading]);

  return {
    feedState,
    refreshFeed,
    loadMore
  };
}
