'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface ConnectionItem {
  id: string;
  other: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export function useConnections(userId?: string) {
  const [connections, setConnections] = useState<ConnectionItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setConnections([]);
      return;
    }
    // Minimal placeholder: assume a collection 'connections' that stores pairs
    const ref = collection(db, 'connections');
    const q = query(ref, where('members', 'array-contains', userId));
    const unsub = onSnapshot(q, (snap) => {
      const items: ConnectionItem[] = [];
      snap.forEach((d) => {
        const data: any = d.data();
        const otherId = (data.members || []).find((m: string) => m !== userId) || 'unknown';
        items.push({ id: d.id, other: { id: otherId, name: otherId } });
      });
      setConnections(items);
    });
    return () => unsub();
  }, [userId]);

  return { connections };
}

