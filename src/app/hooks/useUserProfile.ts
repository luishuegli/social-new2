'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  stats?: {
    activitiesPlannedCount?: number;
  };
}

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState<{ posts: number; groups: number }>({ posts: 0, groups: 0 });

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setCounts({ posts: 0, groups: 0 });
      return;
    }

    let cancelled = false;

    // Live profile updates
    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (cancelled) return;
      setProfile(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : { id: userId });
    });

    // Fetch counts (one-off)
    (async () => {
      try {
        const groupsQ = query(collection(db, 'groups'), where('members', 'array-contains', userId));
        const postsQ = query(collection(db, 'posts'), where('authorId', '==', userId));
        const [groupsSnap, postsSnap] = await Promise.all([getDocs(groupsQ), getDocs(postsQ)]);
        if (!cancelled) setCounts({ groups: groupsSnap.size, posts: postsSnap.size });
      } catch {
        if (!cancelled) setCounts({ posts: 0, groups: 0 });
      }
    })();

    return () => { cancelled = true; unsub(); };
  }, [userId]);

  return { profile, counts };
}

