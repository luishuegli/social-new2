'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGroups } from './useGroups';
import { db } from '../Lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Activity } from '../types';

export type PostableActivity = {
  groupId: string;
  id: string;
  title: string;
  date: Date;
  location?: string;
  type?: string;
};

export function usePostableActivities(): {
  activities: PostableActivity[];
  loading: boolean;
  error: string | null;
} {
  const { groups, loading: groupsLoading, error } = useGroups();
  const { user } = useAuth();
  const [activeEligible, setActiveEligible] = useState<PostableActivity[] | null>(null);

  // Strict gate: active activities where current user is a participant
  useEffect(() => {
    (async () => {
      try {
        if (!user?.uid) { setActiveEligible([]); return; }
        const snap = await getDocs(collection(db, 'activities'));
        const items: PostableActivity[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.status === 'active' && Array.isArray(data.participants) && data.participants.includes(user.uid)) {
            items.push({
              groupId: String(data.groupId || ''),
              id: d.id,
              title: String(data.title || 'Active Activity'),
              date: new Date(String(data.date || Date.now())),
              location: data.location,
              type: data.type,
            });
          }
        });
        setActiveEligible(items);
      } catch {
        setActiveEligible([]);
      }
    })();
  }, [user?.uid]);

  const activities: PostableActivity[] = useMemo(() => {
    try {
      if (activeEligible && activeEligible.length > 0) {
        return activeEligible;
      }
      const now = Date.now();
      return (groups || [])
        .filter((g) => !!g.nextActivity)
        .map((g) => ({ group: g, activity: g.nextActivity! }))
        // Only include activities that are upcoming or ongoing
        .filter(({ activity }) => {
          try {
            const ts = new Date(String((activity as unknown as Activity).date)).getTime();
            return isFinite(ts) ? ts >= now - 1000 * 60 * 60 * 6 : true; // within last 6h or future
          } catch {
            return true;
          }
        })
        .map(({ group, activity }) => {
          const a: Activity = activity as unknown as Activity;
          const parsedDate = new Date(String(a.date));
          return {
          groupId: group.id,
          id: a.id,
          title: a.title,
          date: parsedDate,
          location: a.location,
          type: a.type,
        } as PostableActivity;
        });
    } catch {
      return [];
    }
  }, [groups, activeEligible]);

  return { activities, loading: groupsLoading || activeEligible === null, error };
}


