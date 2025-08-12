'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Group } from '../types';

export function useUserGroups(userId?: string) {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      return;
    }

    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));
    const unsub = onSnapshot(q, (snap) => {
      const items: Group[] = [];
      snap.forEach((d) => {
        const data: any = d.data();
        items.push({
          id: d.id,
          name: data.groupName || 'Unknown Group',
          description: data.description || '',
          memberCount: data.members?.length || 0,
          members: [],
          coverImage: data.profilePictureUrl,
          isPinned: !!data.isPinned,
        });
      });
      setGroups(items);
    });
    return () => unsub();
  }, [userId]);

  return { groups };
}

