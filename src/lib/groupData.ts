/**
 * Centralized group data fetching and caching utility
 * 
 * This ensures all group data (name, avatar, description) is fetched
 * from a single source of truth: the 'groups' collection in Firestore.
 * 
 * Groups are stored:
 * - Firestore: `groups/{groupId}` collection
 * 
 * NEVER store denormalized group data (name, avatar) in posts/activities.
 * Always fetch from groups collection using this utility.
 */

import { db } from '@/app/Lib/firebase';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { logger } from './logger';

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  profilePictureUrl?: string | null;
  category?: string;
  memberCount?: number;
  members?: string[];
}

// Client-side cache (in-memory, cleared on page refresh)
const groupCache = new Map<string, GroupData | null>();
const cacheTimestamp = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get group data from Firestore (client-side)
 * Uses caching to avoid redundant reads
 */
export async function getGroupData(groupId: string): Promise<GroupData | null> {
  if (!groupId) return null;

  // Check cache first
  const cached = groupCache.get(groupId);
  const cachedTime = cacheTimestamp.get(groupId);
  
  if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    return cached;
  }

  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      groupCache.set(groupId, null);
      cacheTimestamp.set(groupId, Date.now());
      return null;
    }

    const data = groupDoc.data();
    const groupData: GroupData = {
      id: groupId,
      name: data.groupName || data.name || 'Group',
      description: data.description,
      profilePictureUrl: data.profilePictureUrl || data.avatar || null,
      category: data.category,
      memberCount: Array.isArray(data.members) ? data.members.length : 0,
      members: Array.isArray(data.members) ? data.members : [],
    };

    // Cache the result
    groupCache.set(groupId, groupData);
    cacheTimestamp.set(groupId, Date.now());
    
    return groupData;
  } catch (error) {
    logger.error('Failed to fetch group data', { groupId, error }, 'groupData');
    return null;
  }
}

/**
 * Batch fetch multiple groups (client-side)
 * More efficient than individual fetches
 */
export async function getGroupsData(groupIds: string[]): Promise<Map<string, GroupData>> {
  const result = new Map<string, GroupData>();
  const uncachedIds: string[] = [];

  // Check cache for each group
  for (const groupId of groupIds) {
    if (!groupId) continue;
    
    const cached = groupCache.get(groupId);
    const cachedTime = cacheTimestamp.get(groupId);
    
    if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
      result.set(groupId, cached);
    } else {
      uncachedIds.push(groupId);
    }
  }

  // Fetch uncached groups
  if (uncachedIds.length > 0) {
    try {
      // Firestore 'in' query limit is 10, so we need to chunk
      const chunks: string[][] = [];
      for (let i = 0; i < uncachedIds.length; i += 10) {
        chunks.push(uncachedIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const groupRefs = chunk.map(id => doc(db, 'groups', id));
        const groupDocs = await Promise.all(groupRefs.map(ref => getDoc(ref)));

        groupDocs.forEach((groupDoc, index) => {
          const groupId = chunk[index];
          
          if (groupDoc.exists()) {
            const data = groupDoc.data();
            const groupData: GroupData = {
              id: groupId,
              name: data.groupName || data.name || 'Group',
              description: data.description,
              profilePictureUrl: data.profilePictureUrl || data.avatar || null,
              category: data.category,
              memberCount: Array.isArray(data.members) ? data.members.length : 0,
              members: Array.isArray(data.members) ? data.members : [],
            };
            
            result.set(groupId, groupData);
            groupCache.set(groupId, groupData);
            cacheTimestamp.set(groupId, Date.now());
          } else {
            result.set(groupId, {
              id: groupId,
              name: 'Group',
              description: undefined,
              profilePictureUrl: null,
            });
            groupCache.set(groupId, null);
            cacheTimestamp.set(groupId, Date.now());
          }
        });
      }
    } catch (error) {
      logger.error('Failed to batch fetch groups', { groupIds: uncachedIds, error }, 'groupData');
      
      // Return default data for failed fetches
      uncachedIds.forEach(groupId => {
        if (!result.has(groupId)) {
          result.set(groupId, {
            id: groupId,
            name: 'Group',
            description: undefined,
            profilePictureUrl: null,
          });
        }
      });
    }
  }

  return result;
}

/**
 * Get group data from Firestore (server-side with Admin SDK)
 * Used in API routes
 */
export async function getGroupDataAdmin(groupId: string): Promise<GroupData | null> {
  if (!groupId) return null;

  try {
    const groupDoc = await adminDb.collection('groups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return null;
    }

    const data = groupDoc.data();
    return {
      id: groupId,
      name: data?.groupName || data?.name || 'Group',
      description: data?.description,
      profilePictureUrl: data?.profilePictureUrl || data?.avatar || null,
      category: data?.category,
      memberCount: Array.isArray(data?.members) ? data.members.length : 0,
      members: Array.isArray(data?.members) ? data.members : [],
    };
  } catch (error) {
    logger.error('Failed to fetch group data (admin)', { groupId, error }, 'groupData');
    return null;
  }
}

/**
 * Batch fetch multiple groups (server-side with Admin SDK)
 * More efficient than individual fetches
 */
export async function getGroupsDataAdmin(groupIds: string[]): Promise<Map<string, GroupData>> {
  const result = new Map<string, GroupData>();
  
  if (groupIds.length === 0) {
    return result;
  }

  // Filter out empty/null IDs
  const validGroupIds = groupIds.filter(id => id);
  
  if (validGroupIds.length === 0) {
    return result;
  }

  try {
    // Firestore 'in' query limit is 10, so we need to chunk
    const chunks: string[][] = [];
    for (let i = 0; i < validGroupIds.length; i += 10) {
      chunks.push(validGroupIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const groupRefs = chunk.map(id => adminDb.collection('groups').doc(id));
      const groupDocs = await adminDb.getAll(...groupRefs);

      groupDocs.forEach((groupDoc, index) => {
        const groupId = chunk[index];
        
        if (groupDoc.exists) {
          const data = groupDoc.data();
          result.set(groupId, {
            id: groupId,
            name: data?.groupName || data?.name || 'Group',
            description: data?.description,
            profilePictureUrl: data?.profilePictureUrl || data?.avatar || null,
            category: data?.category,
            memberCount: Array.isArray(data?.members) ? data.members.length : 0,
            members: Array.isArray(data?.members) ? data.members : [],
          });
        } else {
          result.set(groupId, {
            id: groupId,
            name: 'Group',
            description: undefined,
            profilePictureUrl: null,
          });
        }
      });
    }
  } catch (error) {
    logger.error('Failed to batch fetch groups (admin)', { groupIds: validGroupIds, error }, 'groupData');
    
    // Return default data for failed fetches
    validGroupIds.forEach(groupId => {
      if (!result.has(groupId)) {
        result.set(groupId, {
          id: groupId,
          name: 'Group',
          description: undefined,
          profilePictureUrl: null,
        });
      }
    });
  }

  return result;
}

/**
 * Clear group cache (useful after group updates)
 */
export function clearGroupCache(groupId?: string): void {
  if (groupId) {
    groupCache.delete(groupId);
    cacheTimestamp.delete(groupId);
  } else {
    groupCache.clear();
    cacheTimestamp.clear();
  }
}

/**
 * Get default group data (fallback when group doesn't exist)
 */
export function getDefaultGroupData(groupId: string): GroupData {
  return {
    id: groupId,
    name: 'Group',
    description: undefined,
    profilePictureUrl: null,
  };
}


