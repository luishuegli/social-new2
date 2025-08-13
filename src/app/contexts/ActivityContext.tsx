'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '../Lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

type Activity = {
  id: string;
  title: string;
  groupId: string;
  participants: string[];
  startTime?: any;
  endTime?: any;
  status: 'planned' | 'active' | 'completed';
};

type ActivityContextType = {
  activeActivity: Activity | null;
  startActivity: (activityId: string) => Promise<void>;
  endActivity: () => Promise<void>;
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
          const data = snap.data() as any;
          setActiveActivity({ id: snap.id, ...data } as Activity);
        } else {
          sessionStorage.removeItem('activeActivityId');
        }
      })();
    }
  }, []);

  const startActivity = async (activityId: string) => {
    const ref = doc(db, 'activities', activityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Activity not found');
    const data = snap.data() as any;
    const activity = { id: snap.id, ...data } as Activity;
    await updateDoc(ref, { status: 'active', startTime: data.startTime || serverTimestamp() });
    setActiveActivity({ ...activity, status: 'active' });
    if (typeof window !== 'undefined') sessionStorage.setItem('activeActivityId', activityId);
  };

  const endActivity = async () => {
    if (activeActivity) {
      const ref = doc(db, 'activities', activeActivity.id);
      await updateDoc(ref, { status: 'completed', endTime: serverTimestamp() });
    }
    setActiveActivity(null);
    if (typeof window !== 'undefined') sessionStorage.removeItem('activeActivityId');
  };

  const value = useMemo(() => ({ activeActivity, startActivity, endActivity }), [activeActivity]);
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}

