import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface ConnectionRequest {
  id: string;
  requesterId: string;
  requesterUsername: string;
  requesterPhotoURL: string;
  requesterMessage: string;
  createdAt: any;
  status: 'pending' | 'accepted' | 'declined';
}

export interface UsePaginatedConnectionRequestsOptions {
  userId: string;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedConnectionRequests(options: UsePaginatedConnectionRequestsOptions) {
  const { userId, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<ConnectionRequest>();

  const config = PAGINATION_CONFIG.connectionRequests;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q = query(
      collection(db, 'connections'),
      where('recipientId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [userId]);

  // Load initial requests
  const loadInitial = useCallback(async () => {
    if (state.loading || !userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const requests = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Fetch requester's profile info
          const requesterDoc = await getDoc(doc(db, 'users', data.requesterId));
          const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;
          
          return {
            id: docSnapshot.id,
            requesterId: data.requesterId,
            requesterUsername: requesterData?.username || 'Unknown User',
            requesterPhotoURL: requesterData?.photoURL || '',
            requesterMessage: data.requesterMessage || '',
            createdAt: data.createdAt,
            status: data.status
          };
        })
      );

      setItems(requests);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      console.error('Error loading initial connection requests:', error);
      setError('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading, userId]);

  // Load more requests
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      const q = query(
        buildQuery(state.lastDoc),
        limit(config.batchSize)
      );
      
      const snapshot = await getDocs(q);
      
      const newRequests = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Fetch requester's profile info
          const requesterDoc = await getDoc(doc(db, 'users', data.requesterId));
          const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;
          
          return {
            id: docSnapshot.id,
            requesterId: data.requesterId,
            requesterUsername: requesterData?.username || 'Unknown User',
            requesterPhotoURL: requesterData?.photoURL || '',
            requesterMessage: data.requesterMessage || '',
            createdAt: data.createdAt,
            status: data.status
          };
        })
      );

      appendItems(newRequests);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      console.error('Error loading more connection requests:', error);
      setError('Failed to load more connection requests');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc, userId]);

  // Refresh requests (reload from beginning)
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

  // Load initial data on mount or when userId changes
  useEffect(() => {
    if (userId) {
      loadInitial();
    }
  }, [userId]);

  return {
    requests: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
