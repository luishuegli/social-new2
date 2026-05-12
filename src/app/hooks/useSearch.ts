import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  type: 'user' | 'group';
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  memberCount?: number;
  relevanceScore: number;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  error: Error | null;
  clearSearch: () => void;
}

/**
 * Custom hook for searching users and groups with debouncing
 * 
 * @param options - Configuration options
 * @param options.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param options.minQueryLength - Minimum query length to trigger search (default: 1)
 * 
 * @example
 * ```tsx
 * const { query, setQuery, results, isSearching } = useSearch({ debounceMs: 500 });
 * 
 * return (
 *   <input 
 *     value={query} 
 *     onChange={(e) => setQuery(e.target.value)} 
 *   />
 * );
 * ```
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minQueryLength = 1 } = options;
  
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state if query is too short
    if (!query.trim() || query.trim().length < minQueryLength) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    // Set loading state
    setIsSearching(true);
    setError(null);

    // Debounce search
    timeoutRef.current = setTimeout(async () => {
      try {
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResults(data.results || []);
        setIsSearching(false);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        console.error('Search failed:', err);
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debounceMs, minQueryLength]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
  };
}







