import { DocumentSnapshot, Query, QueryDocumentSnapshot } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';

// Optimal batch sizes for different content types
// Best practice: 10-20 items per batch for smooth infinite scroll
export const PAGINATION_CONFIG = {
  posts: {
    initialLoad: 15,      // Load 15 posts initially
    batchSize: 10,        // Load 10 more at a time
    preloadThreshold: 0.7, // Pre-fetch when 70% scrolled
  },
  activities: {
    initialLoad: 12,      // Load 12 activities initially
    batchSize: 12,        // Load 12 more at a time
    preloadThreshold: 0.7, // Pre-fetch when 70% scrolled
  },
  messages: {
    initialLoad: 20,      // Load 20 messages initially
    batchSize: 20,        // Load 20 more at a time
    preloadThreshold: 0.8, // Pre-fetch when 80% scrolled (faster chat loading)
  },
  discovery: {
    initialLoad: 10,      // Load 10 profiles initially
    batchSize: 10,        // Load 10 more at a time
    preloadThreshold: 0.7, // Pre-fetch when 70% scrolled
  },
  conversations: {
    initialLoad: 15,      // Load 15 conversations initially
    batchSize: 15,        // Load 15 more at a time
    preloadThreshold: 0.7, // Pre-fetch when 70% scrolled
  },
  groups: {
    initialLoad: 12,      // Load 12 groups initially
    batchSize: 12,        // Load 12 more at a time
    preloadThreshold: 0.7, // Pre-fetch when 70% scrolled
  },
  connectionRequests: {
    initialLoad: 15,      // Load 15 requests initially
    batchSize: 15,        // Load 15 more at a time
    preloadThreshold: 0.75, // Pre-fetch when 75% scrolled
  }
} as const;

export interface PaginationState {
  items: any[];
  loading: boolean;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  error: string | null;
}


/**
 * Hook for managing pagination state
 */
export function usePaginationState<T>(): {
  state: PaginationState;
  setItems: (items: T[]) => void;
  appendItems: (items: T[]) => void;
  prependItems: (items: T[]) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setLastDoc: (lastDoc: QueryDocumentSnapshot | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
} {
  const [state, setState] = useState<PaginationState>({
    items: [],
    loading: false,
    hasMore: true,
    lastDoc: null,
    error: null,
  });

  const setItems = (items: T[]) => {
    setState(prev => ({ ...prev, items }));
  };

  const appendItems = (items: T[]) => {
    setState(prev => ({ ...prev, items: [...prev.items, ...items] }));
  };

  const prependItems = (items: T[]) => {
    setState(prev => ({ ...prev, items: [...items, ...prev.items] }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setHasMore = (hasMore: boolean) => {
    setState(prev => ({ ...prev, hasMore }));
  };

  const setLastDoc = (lastDoc: QueryDocumentSnapshot | null) => {
    setState(prev => ({ ...prev, lastDoc }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const reset = () => {
    setState({
      items: [],
      loading: false,
      hasMore: true,
      lastDoc: null,
      error: null,
    });
  };

  return {
    state,
    setItems,
    appendItems,
    prependItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  };
}

/**
 * Throttle function to limit how often a function can be called
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRan = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRan >= delay) {
      func(...args);
      lastRan = now;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastRan = Date.now();
      }, delay - (now - lastRan));
    }
  };
}

/**
 * Hook for infinite scroll detection with optimized pre-fetching
 * Pre-fetches content when user reaches the threshold (default 70-80%)
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean,
  threshold: number = 0.7
) {
  const loadMoreRef = useRef(onLoadMore);
  const hasTriggeredRef = useRef(false);

  // Keep the ref updated
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    // Reset trigger when new content loads
    if (!loading) {
      hasTriggeredRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    // Throttled scroll handler - checks every 150ms max
    const handleScroll = throttle(() => {
      if (loading || !hasMore || hasTriggeredRef.current) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate how far user has scrolled (0 to 1)
      const scrollPercent = (scrollTop + windowHeight) / documentHeight;

      // Pre-fetch when user reaches threshold (e.g., 70-80% of content)
      if (scrollPercent >= threshold) {
        hasTriggeredRef.current = true;
        loadMoreRef.current();
      }
    }, 150); // Throttle to 150ms

    // Initial check in case content is already at threshold
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, threshold]);
}

/**
 * Hook for intersection observer with pre-fetch optimization
 * Uses rootMargin to trigger before element is visible (pre-fetching)
 * This creates a "pre-fetch zone" that triggers loading before user reaches the end
 */
export function useIntersectionObserver(
  onIntersect: () => void,
  hasMore: boolean,
  loading: boolean,
  rootMargin: string = '600px' // Trigger 600px before element is visible
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  const hasTriggeredRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Reset trigger when loading completes
  useEffect(() => {
    if (!loading) {
      hasTriggeredRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create observer with rootMargin for pre-fetching
    // rootMargin: '600px' means trigger 600px before the element enters viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // Only trigger once per load cycle
        if (entry.isIntersecting && hasMore && !loading && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onIntersectRef.current();
        }
      },
      { 
        threshold: 0,
        rootMargin, // Pre-fetch zone
      }
    );

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, rootMargin]);

  return triggerRef;
}

/**
 * Hook for smart pre-fetching based on user scroll behavior
 * Automatically loads next batch when user reaches threshold
 */
export function usePrefetch(
  loadMore: () => Promise<void> | void,
  hasMore: boolean,
  loading: boolean,
  itemCount: number,
  config: typeof PAGINATION_CONFIG[keyof typeof PAGINATION_CONFIG]
) {
  const prefetchTriggeredRef = useRef(false);
  const loadMoreRef = useRef(loadMore);

  // Keep ref updated
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Reset prefetch trigger when new items load
  useEffect(() => {
    if (!loading && itemCount > 0) {
      prefetchTriggeredRef.current = false;
    }
  }, [loading, itemCount]);

  useEffect(() => {
    if (!hasMore || loading || prefetchTriggeredRef.current) return;

    // Use scroll-based pre-fetching
    const handleScroll = throttle(() => {
      if (loading || !hasMore || prefetchTriggeredRef.current) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = (scrollTop + windowHeight) / documentHeight;

      // Trigger pre-fetch at configured threshold
      if (scrollPercent >= config.preloadThreshold) {
        prefetchTriggeredRef.current = true;
        loadMoreRef.current();
      }
    }, 150);

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check immediately in case we're already past threshold
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, config.preloadThreshold]);
}

/**
 * Enhanced pagination hook that combines state management with smart prefetching
 */
export function useEnhancedPagination<T>(
  contentType: keyof typeof PAGINATION_CONFIG
) {
  const config = PAGINATION_CONFIG[contentType];
  const paginationState = usePaginationState<T>();
  
  // Smart prefetching based on scroll position
  usePrefetch(
    paginationState.state.items.length > 0 ? () => {} : () => {}, // Placeholder, actual load handled by consumer
    paginationState.state.hasMore,
    paginationState.state.loading,
    paginationState.state.items.length,
    config
  );

  return {
    ...paginationState,
    config,
  };
}
