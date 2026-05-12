/**
 * Centralized user data fetching and caching utility
 * 
 * This ensures all user data (including profile pictures) is fetched
 * from a single source of truth: the 'users' collection in Firestore.
 * 
 * Profile pictures are stored:
 * - File: Firebase Storage at `profile-pictures/{userId}/...`
 * - URL: Firestore `users/{userId}.profilePictureUrl`
 * 
 * NEVER store denormalized user data (name, avatar) in posts/comments.
 * Always fetch from users collection using this utility.
 */

import { db } from '@/app/Lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, DocumentSnapshot } from 'firebase/firestore';
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { logger } from './logger';

export interface UserData {
  uid: string;
  displayName: string;
  username: string;
  profilePictureUrl: string | null;
  bio?: string;
  email?: string;
}

// Client-side cache (in-memory, cleared on page refresh)
const userCache = new Map<string, UserData | null>();
const cacheTimestamp = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user data from Firestore (client-side)
 * Uses caching to avoid redundant reads
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  // Check cache first
  const cached = userCache.get(userId);
  const cachedTime = cacheTimestamp.get(userId);
  
  if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    return cached;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      userCache.set(userId, null);
      cacheTimestamp.set(userId, Date.now());
      return null;
    }

    const data = userDoc.data();
    const userData: UserData = {
      uid: userId,
      displayName: data.displayName || data.username || 'User',
      username: data.username || data.email?.split('@')[0] || `user${userId.slice(-4)}`,
      profilePictureUrl: data.profilePictureUrl || data.photoURL || null,
      bio: data.bio,
      email: data.email,
    };

    // Cache the result
    userCache.set(userId, userData);
    cacheTimestamp.set(userId, Date.now());
    
    return userData;
  } catch (error) {
    logger.error('Failed to fetch user data', { userId, error }, 'userData');
    return null;
  }
}

/**
 * Batch fetch multiple users (client-side)
 * More efficient than individual fetches
 */
export async function getUsersData(userIds: string[]): Promise<Map<string, UserData>> {
  const result = new Map<string, UserData>();
  const uncachedIds: string[] = [];

  // Check cache for each user
  for (const userId of userIds) {
    const cached = userCache.get(userId);
    const cachedTime = cacheTimestamp.get(userId);
    
    if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
      result.set(userId, cached);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached users
  if (uncachedIds.length > 0) {
    try {
      // Firestore 'in' query limit is 10, so we need to chunk
      const chunks: string[][] = [];
      for (let i = 0; i < uncachedIds.length; i += 10) {
        chunks.push(uncachedIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const userRefs = chunk.map(id => doc(db, 'users', id));
        const userDocs = await Promise.all(userRefs.map(ref => getDoc(ref)));

        userDocs.forEach((userDoc, index) => {
          const userId = chunk[index];
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userData: UserData = {
              uid: userId,
              displayName: data.displayName || data.username || 'User',
              username: data.username || data.email?.split('@')[0] || `user${userId.slice(-4)}`,
              profilePictureUrl: data.profilePictureUrl || data.photoURL || null,
              bio: data.bio,
              email: data.email,
            };
            
            result.set(userId, userData);
            userCache.set(userId, userData);
            cacheTimestamp.set(userId, Date.now());
          } else {
            result.set(userId, {
              uid: userId,
              displayName: 'User',
              username: `user${userId.slice(-4)}`,
              profilePictureUrl: null,
            });
            userCache.set(userId, null);
            cacheTimestamp.set(userId, Date.now());
          }
        });
      }
    } catch (error) {
      logger.error('Failed to batch fetch users', { userIds: uncachedIds, error }, 'userData');
      
      // Return default data for failed fetches
      uncachedIds.forEach(userId => {
        if (!result.has(userId)) {
          result.set(userId, {
            uid: userId,
            displayName: 'User',
            username: `user${userId.slice(-4)}`,
            profilePictureUrl: null,
          });
        }
      });
    }
  }

  return result;
}

/**
 * Get user data from Firestore (server-side with Admin SDK)
 * Used in API routes
 */
export async function getUserDataAdmin(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();
    return {
      uid: userId,
      displayName: data?.displayName || data?.username || 'User',
      username: data?.username || data?.email?.split('@')[0] || `user${userId.slice(-4)}`,
      profilePictureUrl: data?.profilePictureUrl || data?.photoURL || null,
      bio: data?.bio,
      email: data?.email,
    };
  } catch (error) {
    logger.error('Failed to fetch user data (admin)', { userId, error }, 'userData');
    return null;
  }
}

/**
 * Batch fetch multiple users (server-side with Admin SDK)
 * More efficient than individual fetches
 */
export async function getUsersDataAdmin(userIds: string[]): Promise<Map<string, UserData>> {
  const result = new Map<string, UserData>();
  
  if (userIds.length === 0) {
    return result;
  }

  try {
    // Firestore 'in' query limit is 10, so we need to chunk
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      chunks.push(userIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const userRefs = chunk.map(id => adminDb.collection('users').doc(id));
      const userDocs = await adminDb.getAll(...userRefs);

      userDocs.forEach((userDoc, index) => {
        const userId = chunk[index];
        
        if (userDoc.exists) {
          const data = userDoc.data();
          result.set(userId, {
            uid: userId,
            displayName: data?.displayName || data?.username || 'User',
            username: data?.username || data?.email?.split('@')[0] || `user${userId.slice(-4)}`,
            profilePictureUrl: data?.profilePictureUrl || data?.photoURL || null,
            bio: data?.bio,
            email: data?.email,
          });
        } else {
          result.set(userId, {
            uid: userId,
            displayName: 'User',
            username: `user${userId.slice(-4)}`,
            profilePictureUrl: null,
          });
        }
      });
    }
  } catch (error) {
    logger.error('Failed to batch fetch users (admin)', { userIds, error }, 'userData');
    
    // Return default data for failed fetches
    userIds.forEach(userId => {
      if (!result.has(userId)) {
        result.set(userId, {
          uid: userId,
          displayName: 'User',
          username: `user${userId.slice(-4)}`,
          profilePictureUrl: null,
        });
      }
    });
  }

  return result;
}

/**
 * Clear user cache (useful after profile updates)
 */
export function clearUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(userId);
    cacheTimestamp.delete(userId);
  } else {
    userCache.clear();
    cacheTimestamp.clear();
  }
}

/**
 * Get default user data (fallback when user doesn't exist)
 */
export function getDefaultUserData(userId: string): UserData {
  return {
    uid: userId,
    displayName: 'User',
    username: `user${userId.slice(-4)}`,
    profilePictureUrl: null,
  };
}


