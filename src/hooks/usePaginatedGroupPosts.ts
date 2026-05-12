import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface GroupPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  groupId: string;
}

export interface UsePaginatedGroupPostsOptions {
  groupId: string;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedGroupPosts(options: UsePaginatedGroupPostsOptions) {
  const { groupId, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<GroupPost>();

  const config = PAGINATION_CONFIG.posts;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'posts'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc')
    );

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [groupId]);

  // Load initial posts
  const loadInitial = useCallback(async () => {
    if (state.loading || !groupId) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.activityTitle || 'Post',
          content: data.description || '',
          imageUrl: data.media?.[0]?.url || '',
          author: {
            name: data.authorName || data.authorId || 'User',
            avatarUrl: data.authorAvatar || ''
          },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false, // Will be updated separately
          groupId: groupId
        };
      });

      setItems(posts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      console.error('Error loading initial group posts:', error);
      setError('Failed to load group posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading, groupId]);

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
      
      const newPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.activityTitle || 'Post',
          content: data.description || '',
          imageUrl: data.media?.[0]?.url || '',
          author: {
            name: data.authorName || data.authorId || 'User',
            avatarUrl: data.authorAvatar || ''
          },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false,
          groupId: groupId
        };
      });

      appendItems(newPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      console.error('Error loading more group posts:', error);
      setError('Failed to load more group posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc, groupId]);

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

  // Load initial data on mount or when groupId changes
  useEffect(() => {
    if (groupId) {
      loadInitial();
    }
  }, [groupId]);

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
