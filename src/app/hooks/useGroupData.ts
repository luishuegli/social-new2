'use client';

import { useState, useEffect } from 'react';
import { Group, UserProfile } from '../types/firestoreSchema';
import { getGroupDetails, getGroupMembers } from '../services/dataService';

export function useGroupData(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchGroupData = async () => {
      try {
        const [groupData, groupMembers] = await Promise.all([
          getGroupDetails(groupId),
          getGroupMembers(groupId)
        ]);

        if (groupData) {
          setGroup(groupData);
          setMembers(groupMembers);
        } else {
          setError('Group not found');
        }
      } catch (err) {
        setError('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  return { 
    group, 
    members, 
    loading, 
    error,
    memberCount: group?.members?.length || 0,
    displayMembers: members.slice(0, 6),
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
