import { useState, useEffect, useCallback } from 'react';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';
import { useAuth } from '../app/contexts/AuthContext';

export interface DiscoveryConnection {
  profile: {
    uid: string;
    username: string;
    displayName: string;
    bio: string;
    photoURL: string;
    dna: any;
  };
  score: number;
  sparkTitle: string;
  sharedInterests: any[];
}

export interface DiscoveryResponse {
  connections: DiscoveryConnection[];
  meta: {
    candidatePoolSize: number;
    algorithmVersion: string;
    weights: {
      longTerm: number;
      shortTerm: number;
    };
  };
  pagination: {
    hasMore: boolean;
    lastUserId: string | null;
    limit: number;
  };
}

export interface UsePaginatedDiscoveryOptions {
  interestFilter?: string;
  locationRadius?: number;
  searchQuery?: string;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedDiscovery(options: UsePaginatedDiscoveryOptions = {}) {
  const { interestFilter, locationRadius, searchQuery, enableInfiniteScroll = true } = options;
  const { firebaseUser } = useAuth();

  const {
    state,
    setItems,
    appendItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<DiscoveryConnection>();

  const config = PAGINATION_CONFIG.discovery;

  // Load initial discovery connections
  const loadInitial = useCallback(async () => {
    if (state.loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/compass/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          interestFilter,
          locationRadius,
          searchQuery,
          limit: config.initialLoad,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discovery connections');
      }

      const data: DiscoveryResponse = await response.json();

      setItems(data.connections);
      setHasMore(data.pagination.hasMore);
      setLastDoc(data.pagination.lastUserId as any); // Store lastUserId as cursor
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading initial discovery connections:', error);
      }
      setError('Failed to load discovery connections');
    } finally {
      setLoading(false);
    }
  }, [interestFilter, locationRadius, config.initialLoad, state.loading, firebaseUser]);

  // Load more discovery connections
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/compass/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          interestFilter,
          locationRadius,
          searchQuery,
          lastSeenUserId: state.lastDoc, // Pass last seen user ID
          limit: config.batchSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch more discovery connections');
      }

      const data: DiscoveryResponse = await response.json();

      appendItems(data.connections);
      setHasMore(data.pagination.hasMore);
      setLastDoc(data.pagination.lastUserId as any);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading more discovery connections:', error);
      }
      setError('Failed to load more discovery connections');
    } finally {
      setLoading(false);
    }
  }, [interestFilter, locationRadius, config.batchSize, state.loading, state.hasMore, state.lastDoc, firebaseUser]);

  // Refresh discovery connections (reload from beginning)
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
  }, [interestFilter, locationRadius, searchQuery]); // Reload when filters change

  return {
    matches: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
