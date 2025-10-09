'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import { getUserGroups } from '../services/dataService';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [featuredGroup, setFeaturedGroup] = useState<Group | null>(null);
  const [standardGroups, setStandardGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setFeaturedGroup(null);
      setStandardGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchGroups = async () => {
      try {
        const userGroups = await getUserGroups(user.uid);
        
        // Sort groups: pinned first, then by activity date
        const sortedGroups = userGroups.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          if (a.nextActivity && b.nextActivity) {
            return new Date(a.nextActivity.date).getTime() - new Date(b.nextActivity.date).getTime();
          }
          
          if (a.nextActivity && !b.nextActivity) return -1;
          if (!a.nextActivity && b.nextActivity) return 1;
          
          return 0;
        });

        setGroups(sortedGroups);

        const unpinnedGroupsWithActivities = sortedGroups.filter(group => 
          group.nextActivity && !group.isPinned
        );
        
        if (unpinnedGroupsWithActivities.length > 0) {
          setFeaturedGroup(unpinnedGroupsWithActivities[0]);
          setStandardGroups(sortedGroups.filter(group => group.id !== unpinnedGroupsWithActivities[0].id));
        } else {
          setStandardGroups(sortedGroups);
        }
      } catch (err) {
        setError('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  return { 
    groups, 
    featuredGroup, 
    standardGroups, 
    loading, 
    error,
  };
} 