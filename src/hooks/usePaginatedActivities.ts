import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: any;
  time: string;
  location: string;
  groupId: string;
  groupName: string;
  organizerId: string;
  organizerName: string;
  organizerPhotoURL: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
  isPublic: boolean;
  rsvpStatus?: 'going' | 'maybe' | 'not_going';
}

export interface UsePaginatedActivitiesOptions {
  groupId?: string;
  userId?: string;
  status?: Activity['status'];
  enableInfiniteScroll?: boolean;
}

export function usePaginatedActivities(options: UsePaginatedActivitiesOptions = {}) {
  const { groupId, userId, status, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<Activity>();

  const config = PAGINATION_CONFIG.activities;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'activities'),
      orderBy('date', 'asc') // Show upcoming activities first
    );

    // Add filters
    if (groupId) {
      q = query(q, where('groupId', '==', groupId));
    }
    
    if (userId) {
      q = query(q, where('organizerId', '==', userId));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    // Only show public activities or activities user is part of
    if (!userId && !groupId) {
      q = query(q, where('isPublic', '==', true));
    }

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [groupId, userId, status]);

  // Load initial activities
  const loadInitial = useCallback(async () => {
    if (state.loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];

      setItems(activities);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading initial activities:', error);
      }
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading]);

  // Load more activities
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      const q = query(
        buildQuery(state.lastDoc),
        limit(config.batchSize)
      );
      
      const snapshot = await getDocs(q);
      
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];

      appendItems(newActivities);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading more activities:', error);
      }
      setError('Failed to load more activities');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc]);

  // Refresh activities (reload from beginning)
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
  }, [groupId, userId, status]); // Reload when filters change

  return {
    activities: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
