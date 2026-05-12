import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';
import { mapGroupDocument } from '../lib/dataMappers';

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  memberCount: number;
  nextActivity?: {
    title: string;
    date: string;
  };
  isJoined: boolean;
  tags: string[];
  createdAt: any;
}

export interface UsePaginatedGroupsOptions {
  userId?: string;
  featured?: boolean;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedGroups(options: UsePaginatedGroupsOptions = {}) {
  const { userId, featured = false, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<Group>();

  const config = PAGINATION_CONFIG.groups;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'groups'),
      orderBy('createdAt', 'desc')
    );

    // Add filters
    if (userId) {
      q = query(q, where('members', 'array-contains', userId));
    }

    if (featured) {
      q = query(q, where('isFeatured', '==', true));
    }

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [userId, featured]);

  // Load initial groups
  const loadInitial = useCallback(async () => {
    if (state.loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const groups = snapshot.docs.map(doc => mapGroupDocument(doc, userId));

      setItems(groups);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading initial groups:', error);
      }
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading, userId]);

  // Load more groups
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      const q = query(
        buildQuery(state.lastDoc),
        limit(config.batchSize)
      );
      
      const snapshot = await getDocs(q);
      
      const newGroups = snapshot.docs.map(doc => mapGroupDocument(doc, userId));

      appendItems(newGroups);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading more groups:', error);
      }
      setError('Failed to load more groups');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc, userId]);

  // Refresh groups (reload from beginning)
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
  }, [userId, featured]); // Reload when filters change

  return {
    groups: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
