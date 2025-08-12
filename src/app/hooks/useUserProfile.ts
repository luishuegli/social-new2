'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName?: string;
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

    async function load() {
      try {
        // Profile
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!cancelled) {
          setProfile(userSnap.exists() ? ({ id: userSnap.id, ...(userSnap.data() as any) }) : { id: userId });
        }

        // Counts (best-effort; fine for UI)
        const groupsQ = query(collection(db, 'groups'), where('members', 'array-contains', userId));
        const postsQ = query(collection(db, 'posts'), where('authorId', '==', userId));
        const [groupsSnap, postsSnap] = await Promise.all([getDocs(groupsQ), getDocs(postsQ)]);
        if (!cancelled) {
          setCounts({ groups: groupsSnap.size, posts: postsSnap.size });
        }
      } catch (err) {
        if (!cancelled) {
          setCounts({ posts: 0, groups: 0 });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile, counts };
}

