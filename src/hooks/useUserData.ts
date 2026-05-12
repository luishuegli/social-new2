/**
 * Unified User Data Hook - Single Source of Truth
 * 
 * This hook replaces:
 * - useUserProfile
 * - AuthContext user data fetching
 * - Direct Firestore queries in components
 * 
 * All components should use this hook to get user data.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUserData, getUsersData, clearUserCache, type UserData } from '@/lib/userData';
import { logger } from '@/lib/logger';

/**
 * Unified hook for fetching user data
 * 
 * @param userId - User ID to fetch. If null/undefined, returns null.
 * @returns User data, loading state, error, and refresh function
 */
export function useUserData(userId: string | null | undefined) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = await getUserData(userId);
      setUser(userData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user data');
      logger.error('useUserData fetch error', error, 'useUserData');
      setError(error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Refresh function to manually refetch user data
  const refresh = useCallback(() => {
    if (userId) {
      clearUserCache(userId);
      fetchUser();
    }
  }, [userId, fetchUser]);

  return {
    user,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for fetching multiple users at once
 * 
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId to UserData, loading state, error, and refresh function
 */
export function useUsersData(userIds: string[]) {
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (userIds.length === 0) {
      setUsers(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const usersMap = await getUsersData(userIds);
      setUsers(usersMap);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch users data');
      logger.error('useUsersData fetch error', error, 'useUserData');
      setError(error);
      setUsers(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [userIds]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Refresh function to manually refetch users data
  const refresh = useCallback(() => {
    userIds.forEach(id => clearUserCache(id));
    fetchUsers();
  }, [userIds, fetchUsers]);

  return {
    users: users,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for current authenticated user
 * Combines Firebase Auth user with Firestore profile data
 * 
 * @param firebaseUser - Firebase Auth user object
 * @returns Combined user data with profile information
 */
export function useCurrentUser(firebaseUser: any) {
  const { user: profileData, isLoading, error, refresh } = useUserData(firebaseUser?.uid);

  // Combine Firebase Auth data with Firestore profile data
  const currentUser = firebaseUser && profileData ? {
    ...firebaseUser,
    ...profileData,
    // Ensure profile picture is from Firestore (single source of truth)
    profilePictureUrl: profileData.profilePictureUrl || firebaseUser.photoURL || null,
    displayName: profileData.displayName || firebaseUser.displayName || 'User',
    username: profileData.username || firebaseUser.email?.split('@')[0] || `user${firebaseUser.uid.slice(-4)}`,
  } : null;

  return {
    user: currentUser,
    isLoading,
    error,
    refresh,
  };
}
