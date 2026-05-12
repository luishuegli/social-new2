import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface UserPost {
  id: string;
  title?: string;
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
  authenticityType?: string;
  postType?: string;
  groupId?: string;
}

export interface UsePaginatedUserPostsOptions {
  userId: string;
  filter?: 'all' | 'Live' | 'Collaborative';
  enableInfiniteScroll?: boolean;
}

export function usePaginatedUserPosts(options: UsePaginatedUserPostsOptions) {
  const { userId, filter = 'all', enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<UserPost>();

  const config = PAGINATION_CONFIG.posts;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [userId]);

  // Load initial posts
  const loadInitial = useCallback(async () => {
    if (state.loading || !userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.activityTitle,
          content: data.description || data.content || '',
          imageUrl: data.media?.[0]?.url || data.imageUrl || '',
          author: {
            name: data.authorName || data.authorId || 'User',
            avatarUrl: data.authorAvatar || ''
          },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false,
          authenticityType: data.authenticityType,
          postType: data.postType,
          groupId: data.groupId
        };
      });

      // Apply client-side filtering
      const filteredPosts = posts.filter(post => {
        if (filter === 'Live') return post.authenticityType === 'Live Post';
        if (filter === 'Collaborative') return post.postType === 'Collaborative';
        return true;
      });

      setItems(filteredPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      console.error('Error loading initial user posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading, userId, filter]);

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
          title: data.title || data.activityTitle,
          content: data.description || data.content || '',
          imageUrl: data.media?.[0]?.url || data.imageUrl || '',
          author: {
            name: data.authorName || data.authorId || 'User',
            avatarUrl: data.authorAvatar || ''
          },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false,
          authenticityType: data.authenticityType,
          postType: data.postType,
          groupId: data.groupId
        };
      });

      // Apply client-side filtering
      const filteredNewPosts = newPosts.filter(post => {
        if (filter === 'Live') return post.authenticityType === 'Live Post';
        if (filter === 'Collaborative') return post.postType === 'Collaborative';
        return true;
      });

      appendItems(filteredNewPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      console.error('Error loading more user posts:', error);
      setError('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc, filter]);

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
    if (userId) {
      loadInitial();
    }
  }, [userId, filter]); // Reload when filter changes

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
