/**
 * Unified Group Member Count Hook - Single Source of Truth
 * 
 * Always calculates member count from members array (never uses denormalized memberCount)
 */

'use client';

import { useMemo } from 'react';
import { useGroupData } from '@/app/hooks/useGroupData';
import { getGroupData } from '@/lib/groupData';

/**
 * Hook for getting group member count
 * Always calculates from members array (single source of truth)
 * 
 * @param groupId - Group ID
 * @returns Member count
 */
export function useGroupMemberCount(groupId: string | null | undefined): number {
  const { group } = useGroupData(groupId || '');

  const memberCount = useMemo(() => {
    if (!group) return 0;
    
    // Always calculate from members array (single source of truth)
    // Never use denormalized memberCount field
    if (Array.isArray(group.members)) {
      return group.members.length;
    }
    
    return 0;
  }, [group]);

  return memberCount;
}

/**
 * Hook for getting multiple group member counts
 * 
 * @param groupIds - Array of group IDs
 * @returns Map of groupId to member count
 */
export async function getGroupMemberCounts(groupIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  
  if (groupIds.length === 0) {
    return counts;
  }

  try {
    // Fetch all groups
    const groups = await Promise.all(
      groupIds.map(id => getGroupData(id))
    );

    groups.forEach((group, index) => {
      const groupId = groupIds[index];
      if (group) {
        // Always calculate from members array
        const count = Array.isArray(group.members) ? group.members.length : 0;
        counts.set(groupId, count);
      } else {
        counts.set(groupId, 0);
      }
    });
  } catch (error) {
    // Return 0 for all groups on error
    groupIds.forEach(id => counts.set(id, 0));
  }

  return counts;
}
