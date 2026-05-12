import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  images?: string[];
  timestamp: any;
  likes: number;
  comments: number;
  groupId?: string;
  groupName?: string;
}

export interface UsePaginatedPostsOptions {
  groupId?: string;
  userId?: string;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedPosts(options: UsePaginatedPostsOptions = {}) {
  const { groupId, userId, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<Post>();

  const config = PAGINATION_CONFIG.posts;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'posts'),
      orderBy('timestamp', 'desc')
    );

    // Add filters
    if (groupId) {
      q = query(q, where('groupId', '==', groupId));
    }
    
    if (userId) {
      q = query(q, where('authorId', '==', userId));
    }

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [groupId, userId]);

  // Load initial posts
  const loadInitial = useCallback(async () => {
    if (state.loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setItems(posts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading initial posts:', error);
      }
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      const q = query(
        buildQuery(state.lastDoc),
        limit(config.batchSize)
      );
      
      const snapshot = await getDocs(q);
      
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      appendItems(newPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading more posts:', error);
      }
      setError('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc]);

  // Refresh posts (reload from beginning)
  const refresh = useCallback(async () => {
    reset();
    await loadInitial();
  }, [reset, loadInitial]);

  // Set up infinite scroll
  const triggerRef = useIntersectionObserver(
    loadMore,
    state.hasMore,
    state.loading
  );

  // Load initial data on mount or when dependencies change
  useEffect(() => {
    loadInitial();
  }, [groupId, userId]); // Reload when filters change

  return {
    posts: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
