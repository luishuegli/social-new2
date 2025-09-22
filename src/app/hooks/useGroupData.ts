'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string;
  username?: string;
  joinedAt?: Date;
}

export interface GroupData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: GroupMember[];
  memberIds: string[]; // Full list of member IDs
  displayMembers: GroupMember[]; // First 6-8 for UI
  nextActivity?: any;
  latestActivity?: any;
}

/**
 * Centralized hook for group data with real-time synchronization
 * Ensures consistent member count across all components
 */
export function useGroupData(groupId: string) {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!groupId) {
      setGroupData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time listener for group document
    const unsubscribe = onSnapshot(
      doc(db, 'groups', groupId),
      async (snapshot) => {
        if (!snapshot.exists()) {
          setError('Group not found');
          setLoading(false);
          return;
        }

        const data = snapshot.data();
        const memberIds = Array.isArray(data.members) ? data.members : [];

        // Fetch member profiles (limit to prevent excessive queries)
        const memberProfiles: GroupMember[] = [];
        const memberLimit = Math.min(memberIds.length, 20); // Reasonable limit

        for (let i = 0; i < memberLimit; i++) {
          const uid = memberIds[i];
          try {
            // Use server API for member data to avoid client-side permission issues
            const response = await fetch(`/api/user-profile?uid=${uid}`);
            if (response.ok) {
              const userData = await response.json();
              memberProfiles.push({
                id: uid,
                name: userData.displayName || 'User',
                avatarUrl: userData.profilePictureUrl || '',
                username: userData.username,
                joinedAt: userData.joinedAt ? new Date(userData.joinedAt) : undefined
              });
            } else {
              // Fallback for missing user data
              memberProfiles.push({
                id: uid,
                name: 'User',
                avatarUrl: ''
              });
            }
          } catch {
            memberProfiles.push({
              id: uid,
              name: 'User',
              avatarUrl: ''
            });
          }
        }

        const groupData: GroupData = {
          id: snapshot.id,
          name: (data.groupName || data.name || 'Unknown Group').replace(/\s+\d+$/, ''),
          description: data.description || 'No description available',
          memberCount: memberIds.length, // Single source of truth
          members: memberProfiles,
          memberIds: memberIds,
          displayMembers: memberProfiles.slice(0, 6), // Consistent preview limit
          nextActivity: data.nextActivity,
          latestActivity: data.latestActivity
        };

        setGroupData(groupData);
        setLoading(false);
      },
      (err) => {
        console.error('Group data listener error:', err);
        setError('Failed to load group data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, user?.uid]);

  const refreshMembers = useCallback(async () => {
    // Force refresh member data
    if (!groupData) return;
    
    setLoading(true);
    // Re-trigger the listener by updating a timestamp or similar
    // This is handled automatically by the onSnapshot listener
  }, [groupData]);

  return {
    groupData,
    loading,
    error,
    refreshMembers,
    // Convenience accessors
    memberCount: groupData?.memberCount || 0,
    displayMembers: groupData?.displayMembers || [],
    allMembers: groupData?.members || []
  };
}

/**
 * Hook for multiple groups data
 */
export function useGroupsData(groupIds: string[]) {
  const [groupsData, setGroupsData] = useState<Map<string, GroupData>>(new Map());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!groupIds.length) {
      setGroupsData(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];
    const dataMap = new Map<string, GroupData>();

    groupIds.forEach(groupId => {
      const unsubscribe = onSnapshot(
        doc(db, 'groups', groupId),
        async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const memberIds = Array.isArray(data.members) ? data.members : [];

            // Simplified member loading for multiple groups
            const groupData: GroupData = {
              id: snapshot.id,
              name: (data.groupName || data.name || 'Unknown Group').replace(/\s+\d+$/, ''),
              description: data.description || 'No description available',
              memberCount: memberIds.length,
              members: [], // Load on demand
              memberIds: memberIds,
              displayMembers: [], // Load on demand
              nextActivity: data.nextActivity,
              latestActivity: data.latestActivity
            };

            dataMap.set(groupId, groupData);
            setGroupsData(new Map(dataMap));
          }
        }
      );
      unsubscribes.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [groupIds.join(','), user?.uid]);

  return {
    groupsData,
    loading,
    getGroupData: (groupId: string) => groupsData.get(groupId),
    getAllGroupsData: () => Array.from(groupsData.values())
  };
}
