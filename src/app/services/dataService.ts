import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';
import { UserProfile, Group } from '@/app/types/firestoreSchema';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function setCache(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

function getCache(key: string): any | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const cacheKey = `user_${userId}`;
  const cachedUser = getCache(cacheKey);
  if (cachedUser) return cachedUser;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userProfile = { uid: userSnap.id, ...userSnap.data() } as UserProfile;
      setCache(cacheKey, userProfile);
      return userProfile;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}

export async function getGroupDetails(groupId: string): Promise<Group | null> {
  const cacheKey = `group_${groupId}`;
  const cachedGroup = getCache(cacheKey);
  if (cachedGroup) return cachedGroup;

  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const groupData = { id: groupSnap.id, ...groupSnap.data() } as Group;
      setCache(cacheKey, groupData);
      return groupData;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching group details for ${groupId}:`, error);
    return null;
  }
}

export async function getGroupMembers(groupId: string): Promise<UserProfile[]> {
  try {
    const group = await getGroupDetails(groupId);
    if (!group || !group.members) {
      return [];
    }
    const memberPromises = group.members.map(userId => getUserProfile(userId));
    const members = await Promise.all(memberPromises);
    return members.filter(member => member !== null) as UserProfile[];
  } catch (error) {
    console.error(`Error fetching group members for ${groupId}:`, error);
    return [];
  }
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    return groups;
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error);
    return [];
  }
}
