'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getUserProfile } from '../services/dataService';
import { UserProfile } from '../types/firestoreSchema';

export interface Connection {
  id: string;
  members: UserProfile[];
}

export function useConnections(userId?: string) {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!userId) {
      setConnections([]);
      return;
    }

    const q = query(collection(db, 'connections'), where('members', 'array-contains', userId));
    const unsub = onSnapshot(q, async (snap) => {
      const allConnections: Connection[] = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const memberIds = (data.members || []).filter((id: string) => id !== userId);
        
        const memberPromises = memberIds.map((id: string) => getUserProfile(id));
        const members = (await Promise.all(memberPromises)).filter(p => p) as UserProfile[];

        allConnections.push({ id: doc.id, members });
      }
      setConnections(allConnections);
    });

    return unsub;
  }, [userId]);

  return { connections };
}

