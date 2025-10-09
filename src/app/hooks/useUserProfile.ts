'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserProfile as fetchUserProfile } from '../services/dataService';
import { UserProfile } from '../types/firestoreSchema';

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

    const fetchProfileData = async () => {
      const userProfile = await fetchUserProfile(userId);
      if (!cancelled) {
        setProfile(userProfile);
      }
    };

    fetchProfileData();

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

    return () => { cancelled = true; };
  }, [userId]);

  return { profile, counts };
}

