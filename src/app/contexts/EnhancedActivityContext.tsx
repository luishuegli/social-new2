'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../Lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export type Activity = {
  id: string;
  title: string;
  description?: string;
  groupId: string;
  groupName?: string;
  participants: string[];
  participantProfiles?: Array<{ id: string; name: string; avatarUrl: string }>;
  startTime?: Date;
  endTime?: Date;
  date?: Date;
  location?: string;
  status: 'planned' | 'active' | 'completed';
  maxParticipants?: number;
  category?: string;
  type?: string;
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

type EnhancedActivityContextType = {
  // Active activity state
  activeActivity: Activity | null;
  startActivity: (activityId: string, userId?: string) => Promise<void>;
  endActivity: () => Promise<void>;
  
  // All user's activities with real-time sync
  userActivities: Activity[];
  userActivitiesLoading: boolean;
  
  // Activity participant management
  updateActivityParticipants: (activityId: string, participants: string[]) => void;
  getActivityById: (activityId: string) => Activity | null;
  
  // Real-time activity updates
  refreshActivities: () => Promise<void>;
};

const EnhancedActivityContext = createContext<EnhancedActivityContextType | undefined>(undefined);

export function EnhancedActivityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [userActivitiesLoading, setUserActivitiesLoading] = useState(true);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);

  // Get user's group IDs for activity filtering
  useEffect(() => {
    if (!user?.uid) {
      setUserGroupIds([]);
      return;
    }

    const fetchUserGroups = async () => {
      try {
        const response = await fetch(`/api/my-groups?uid=${encodeURIComponent(user.uid)}`);
        if (response.ok) {
          const data = await response.json();
          const groupIds = (data.groups || []).map((g: any) => g.id);
          setUserGroupIds(groupIds);
        }
      } catch (error) {
        console.error('Failed to fetch user groups:', error);
      }
    };

    fetchUserGroups();
  }, [user?.uid]);

  // Real-time listener for user's activities
  useEffect(() => {
    if (!user?.uid || userGroupIds.length === 0) {
      setUserActivities([]);
      setUserActivitiesLoading(false);
      return;
    }

    setUserActivitiesLoading(true);

    // Listen to all activities where user is participant OR user is in the group
    const activitiesRef = collection(db, 'activities');
    const unsubscribe = onSnapshot(
      activitiesRef,
      async (snapshot) => {
        const activities: Activity[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const isParticipant = (data.participants || []).includes(user.uid);
          const isInUserGroup = userGroupIds.includes(data.groupId);
          const isRelevantStatus = ['planned', 'active'].includes(data.status);

          if ((isParticipant || isInUserGroup) && isRelevantStatus) {
            // Enrich with participant profiles
            const participantIds = (data.participants || []).slice(0, 6);
            const participantProfiles = [];
            
            for (const pid of participantIds) {
              try {
                const userDoc = await getDoc(doc(db, 'users', pid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  participantProfiles.push({
                    id: userDoc.id,
                    name: userData.displayName || 'User',
                    avatarUrl: userData.profilePictureUrl || ''
                  });
                } else {
                  participantProfiles.push({ id: pid, name: 'User', avatarUrl: '' });
                }
              } catch {
                participantProfiles.push({ id: pid, name: 'User', avatarUrl: '' });
              }
            }

            const activity: Activity = {
              id: docSnap.id,
              title: data.title || 'Untitled Activity',
              description: data.description,
              groupId: data.groupId,
              groupName: data.groupName,
              participants: data.participants || [],
              participantProfiles,
              startTime: toDateSafe(data.startTime),
              endTime: toDateSafe(data.endTime),
              date: toDateSafe(data.date),
              location: data.location,
              status: data.status || 'planned',
              maxParticipants: data.maxParticipants,
              category: data.category,
              type: data.type
            };

            activities.push(activity);
          }
        }

        setUserActivities(activities);
        setUserActivitiesLoading(false);

        // Update active activity if it's in the list
        if (activeActivity) {
          const updatedActive = activities.find(a => a.id === activeActivity.id);
          if (updatedActive) {
            setActiveActivity(updatedActive);
          }
        }
      },
      (error) => {
        console.error('Activities listener error:', error);
        setUserActivitiesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, userGroupIds.join(','), activeActivity?.id]);

  // Persist active activity in sessionStorage
  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('activeActivityId') : null;
    if (savedId && userActivities.length > 0) {
      const savedActivity = userActivities.find(a => a.id === savedId);
      if (savedActivity) {
        setActiveActivity(savedActivity);
      } else {
        sessionStorage.removeItem('activeActivityId');
      }
    }
  }, [userActivities]);

  const startActivity = useCallback(async (activityId: string, userId?: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required to start an activity');
      }

      // Use server route to start activity
      const response = await fetch('/api/activities/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, uid: userId })
      });

      if (!response.ok) {
        throw new Error('Failed to start activity');
      }

      // Find the activity in our current list
      const activity = userActivities.find(a => a.id === activityId);
      if (activity) {
        const updatedActivity = { ...activity, status: 'active' as const };
        setActiveActivity(updatedActivity);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('activeActivityId', activityId);
        }
      }
    } catch (error) {
      console.error('Failed to start activity:', error);
      throw error;
    }
  }, [userActivities]);

  const endActivity = useCallback(async () => {
    if (!activeActivity) return;

    try {
      const ref = doc(db, 'activities', activeActivity.id);
      await updateDoc(ref, { 
        status: 'completed', 
        endTime: serverTimestamp() 
      });

      setActiveActivity(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('activeActivityId');
      }
    } catch (error) {
      console.error('Failed to end activity:', error);
      throw error;
    }
  }, [activeActivity]);

  const updateActivityParticipants = useCallback((activityId: string, participants: string[]) => {
    setUserActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, participants }
          : activity
      )
    );

    // Update active activity if it matches
    if (activeActivity?.id === activityId) {
      setActiveActivity(prev => prev ? { ...prev, participants } : null);
    }
  }, [activeActivity?.id]);

  const getActivityById = useCallback((activityId: string): Activity | null => {
    return userActivities.find(a => a.id === activityId) || null;
  }, [userActivities]);

  const refreshActivities = useCallback(async () => {
    // Activities are automatically refreshed via real-time listener
    // This function exists for manual refresh if needed
    setUserActivitiesLoading(true);
    // The useEffect listener will handle the refresh
  }, []);

  const value: EnhancedActivityContextType = {
    activeActivity,
    startActivity,
    endActivity,
    userActivities,
    userActivitiesLoading,
    updateActivityParticipants,
    getActivityById,
    refreshActivities
  };

  return (
    <EnhancedActivityContext.Provider value={value}>
      {children}
    </EnhancedActivityContext.Provider>
  );
}

export function useEnhancedActivity() {
  const context = useContext(EnhancedActivityContext);
  if (!context) {
    throw new Error('useEnhancedActivity must be used within EnhancedActivityProvider');
  }
  return context;
}
