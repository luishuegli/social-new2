'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiCallOptions {
  requireAuth?: boolean;
  retries?: number;
  timeout?: number;
}

/**
 * Standardized hook for making API calls with consistent error handling,
 * loading states, and authentication
 */
export function useApiCall<T = any>(options: ApiCallOptions = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    url: string, 
    fetchOptions: RequestInit = {}
  ): Promise<T | null> => {
    const { requireAuth = false, retries = 1, timeout = 10000 } = options;

    // Check authentication if required
    if (requireAuth && !user) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Add auth token if user is authenticated
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...fetchOptions.headers as Record<string, string>
        };

        if (user && requireAuth) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;

      } catch (error: any) {
        lastError = error;
        console.error(`API call attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            error.message?.includes('401') || 
            error.message?.includes('403')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'API call failed';
    setState({ data: null, loading: false, error: errorMessage });
    return null;

  }, [user, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading
  };
}

/**
 * Hook for making authenticated API calls
 */
export function useAuthenticatedApiCall<T = any>(options: Omit<ApiCallOptions, 'requireAuth'> = {}) {
  return useApiCall<T>({ ...options, requireAuth: true });
}

/**
 * Hook for making public API calls
 */
export function usePublicApiCall<T = any>(options: ApiCallOptions = {}) {
  return useApiCall<T>({ ...options, requireAuth: false });
}






