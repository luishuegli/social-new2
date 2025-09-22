'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '../Lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

type Activity = {
  id: string;
  title: string;
  groupId: string;
  participants: string[];
  startTime?: Date;
  endTime?: Date;
  status: 'planned' | 'active' | 'completed';
};

type FirestoreTimestampLike = { toDate?: () => Date } | Date | string | number | null | undefined;

function toDateSafe(value: FirestoreTimestampLike): Date | undefined {
  try {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    return undefined;
  } catch {
    return undefined;
  }
}

type ActivityContextType = {
  activeActivity: Activity | null;
  startActivity: (activityId: string, userId?: string) => Promise<void>;
  endActivity: () => Promise<void>;
  leaveActivity: (userId?: string) => Promise<void>;
};

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  // Persist active activity id in sessionStorage so refresh keeps the bar
  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('activeActivityId') : null;
    if (savedId) {
      // Try to hydrate on load
      (async () => {
        const ref = doc(db, 'activities', savedId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const raw = snap.data() as Record<string, unknown>;
          setActiveActivity({
            id: snap.id,
            title: String(raw.title || ''),
            groupId: String(raw.groupId || ''),
            participants: Array.isArray(raw.participants) ? (raw.participants as string[]) : [],
            startTime: toDateSafe(raw.startTime as FirestoreTimestampLike),
            endTime: toDateSafe(raw.endTime as FirestoreTimestampLike),
            status: (raw.status as Activity['status']) || 'planned',
          });
        } else {
          sessionStorage.removeItem('activeActivityId');
        }
      })();
    }
  }, []);

  const startActivity = async (activityId: string, userId?: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required to start an activity');
      }
      // Use server route to bypass client rules
      const resp = await fetch('/api/activities/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId, uid: userId }) });
      if (!resp.ok) throw new Error('Failed to start activity');
      const ref = doc(db, 'activities', activityId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Activity not found');
      const raw = snap.data() as Record<string, unknown>;
      const activity: Activity = {
        id: snap.id,
        title: String(raw.title || ''),
        groupId: String(raw.groupId || ''),
        participants: Array.isArray(raw.participants) ? (raw.participants as string[]) : [],
        startTime: toDateSafe(raw.startTime as FirestoreTimestampLike),
        endTime: toDateSafe(raw.endTime as FirestoreTimestampLike),
        status: (raw.status as Activity['status']) || 'active',
      };
      setActiveActivity(activity);
      if (typeof window !== 'undefined') sessionStorage.setItem('activeActivityId', activityId);
    } catch (e) {
      throw e;
    }
  };

  const endActivity = async () => {
    if (activeActivity) {
      const ref = doc(db, 'activities', activeActivity.id);
      await updateDoc(ref, { status: 'completed', endTime: serverTimestamp() });
    }
    setActiveActivity(null);
    if (typeof window !== 'undefined') sessionStorage.removeItem('activeActivityId');
  };

  const leaveActivity = async (userId?: string) => {
    if (!activeActivity || !userId) {
      throw new Error('No active activity or user ID provided');
    }

    try {
      // Call the RSVP API to leave the activity
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activityId: activeActivity.id,
          groupId: activeActivity.groupId,
          userId: userId,
          action: 'leave'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave activity');
      }

      // Clear the active activity from context and session
      setActiveActivity(null);
      if (typeof window !== 'undefined') sessionStorage.removeItem('activeActivityId');

      console.log('Successfully left activity:', activeActivity.title);
    } catch (error) {
      console.error('Error leaving activity:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({ activeActivity, startActivity, endActivity, leaveActivity }), [activeActivity]);
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}

