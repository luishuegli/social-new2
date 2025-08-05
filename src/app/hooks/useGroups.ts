'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Group, LatestActivity } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [featuredGroup, setFeaturedGroup] = useState<Group | null>(null);
  const [standardGroups, setStandardGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Development mode - use mock data when Firebase is not configured
  const isDevelopment = process.env.NODE_ENV === 'development';

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

    // Use mock data in development mode
    if (isDevelopment) {
      import('../utils/mockGroups').then(({ mockGroups }) => {
        // Add pin status to mock groups (randomly pin some groups)
        const groupsWithPins = mockGroups.map(group => ({
          ...group,
          isPinned: Math.random() > 0.7 // 30% chance of being pinned
        }));
        
        setGroups(groupsWithPins);
        
        // Sort groups: pinned first, then by activity date
        const sortedGroups = groupsWithPins.sort((a, b) => {
          // First sort by pinned status
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          // Then sort by activity date (if both have activities)
          if (a.nextActivity && b.nextActivity) {
            return new Date(a.nextActivity.date).getTime() - new Date(b.nextActivity.date).getTime();
          }
          
          // If only one has activity, prioritize it
          if (a.nextActivity && !b.nextActivity) return -1;
          if (!a.nextActivity && b.nextActivity) return 1;
          
          return 0;
        });
        
        // Find featured group (group with soonest activity that's not pinned)
        const unpinnedGroupsWithActivities = sortedGroups.filter(group => 
          group.nextActivity && !group.isPinned
        );
        
        if (unpinnedGroupsWithActivities.length > 0) {
          setFeaturedGroup(unpinnedGroupsWithActivities[0]);
          setStandardGroups(sortedGroups.filter(group => group.id !== unpinnedGroupsWithActivities[0].id));
        } else {
          setStandardGroups(sortedGroups);
        }
        
        setLoading(false);
      }).catch(() => {
        setError('Failed to load mock groups');
        setLoading(false);
      });
      return;
    }

    try {
      // Query groups where the current user is a member
      const groupsRef = collection(db, 'groups');
      const q = query(
        groupsRef,
        where('members', 'array-contains', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const groupsData: Group[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            const group: Group = {
              id: doc.id,
              name: data.name || 'Unknown Group',
              description: data.description || 'No description available',
              memberCount: data.memberCount || 0,
              members: data.members || [],
              nextActivity: data.nextActivity ? {
                id: data.nextActivity.id,
                title: data.nextActivity.title,
                date: data.nextActivity.date?.toDate() || new Date(),
                location: data.nextActivity.location,
                type: data.nextActivity.type || 'event'
              } : undefined,
              latestActivity: data.latestActivity ? {
                type: data.latestActivity.type,
                author: data.latestActivity.author,
                content: data.latestActivity.content,
                timestamp: data.latestActivity.timestamp?.toDate() || new Date(),
                imageUrl: data.latestActivity.imageUrl,
                pollQuestion: data.latestActivity.pollQuestion
              } : undefined,
              category: data.category || 'General',
              coverImage: data.coverImage,
              isPinned: data.isPinned || false,
            };

            groupsData.push(group);
          });

          // Sort groups: pinned first, then by activity date
          const sortedGroups = groupsData.sort((a, b) => {
            // First sort by pinned status
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            
            // Then sort by activity date (if both have activities)
            if (a.nextActivity && b.nextActivity) {
              return new Date(a.nextActivity.date).getTime() - new Date(b.nextActivity.date).getTime();
            }
            
            // If only one has activity, prioritize it
            if (a.nextActivity && !b.nextActivity) return -1;
            if (!a.nextActivity && b.nextActivity) return 1;
            
            return 0;
          });

          setGroups(sortedGroups);
          
          // Find featured group (group with soonest activity that's not pinned)
          const unpinnedGroupsWithActivities = sortedGroups.filter(group => 
            group.nextActivity && !group.isPinned
          );
          
          if (unpinnedGroupsWithActivities.length > 0) {
            setFeaturedGroup(unpinnedGroupsWithActivities[0]);
            setStandardGroups(sortedGroups.filter(group => group.id !== unpinnedGroupsWithActivities[0].id));
          } else {
            setStandardGroups(sortedGroups);
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching groups:', error);
          setError('Failed to load groups');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up groups listener:', error);
      setError('Failed to load groups');
      setLoading(false);
    }
  }, [user, isDevelopment]);

  const handleJoinActivity = async (groupId: string, activityId: string) => {
    try {
      if (isDevelopment) {
        // Update mock data
        setGroups(prev => 
          prev.map(group => 
            group.id === groupId && group.nextActivity?.id === activityId
              ? { 
                  ...group, 
                  nextActivity: { 
                    ...group.nextActivity, 
                    joined: !group.nextActivity.joined 
                  }
                }
              : group
          )
        );
        
        // Update featured group if it's the one being modified
        setFeaturedGroup(prev => 
          prev && prev.id === groupId && prev.nextActivity?.id === activityId
            ? { 
                ...prev, 
                nextActivity: { 
                  ...prev.nextActivity, 
                  joined: !prev.nextActivity.joined 
                }
              }
            : prev
        );
        
        // Update standard groups
        setStandardGroups(prev => 
          prev.map(group => 
            group.id === groupId && group.nextActivity?.id === activityId
              ? { 
                  ...group, 
                  nextActivity: { 
                    ...group.nextActivity, 
                    joined: !group.nextActivity.joined 
                  }
                }
              : group
          )
        );
        
        return;
      }

      // Update Firebase
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find(g => g.id === groupId);
      const currentActivity = currentGroup?.nextActivity;
      
      if (currentActivity) {
        await updateDoc(groupRef, {
          [`nextActivity.joined`]: !currentActivity.joined
        });
      }
    } catch (error) {
      console.error('Error joining activity:', error);
    }
  };

  const handlePinToggle = async (groupId: string) => {
    try {
      if (isDevelopment) {
        // Update mock data
        setGroups(prev => 
          prev.map(group => 
            group.id === groupId 
              ? { ...group, isPinned: !group.isPinned }
              : group
          )
        );
        
        // Re-sort groups after pin toggle
        const updatedGroups = groups.map(group => 
          group.id === groupId 
            ? { ...group, isPinned: !group.isPinned }
            : group
        );
        
        const sortedGroups = updatedGroups.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          if (a.nextActivity && b.nextActivity) {
            return new Date(a.nextActivity.date).getTime() - new Date(b.nextActivity.date).getTime();
          }
          
          if (a.nextActivity && !b.nextActivity) return -1;
          if (!a.nextActivity && b.nextActivity) return 1;
          
          return 0;
        });
        
        const unpinnedGroupsWithActivities = sortedGroups.filter(group => 
          group.nextActivity && !group.isPinned
        );
        
        if (unpinnedGroupsWithActivities.length > 0) {
          setFeaturedGroup(unpinnedGroupsWithActivities[0]);
          setStandardGroups(sortedGroups.filter(group => group.id !== unpinnedGroupsWithActivities[0].id));
        } else {
          setStandardGroups(sortedGroups);
        }
        
        return;
      }

      // Update Firebase
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find(g => g.id === groupId);
      await updateDoc(groupRef, {
        isPinned: !currentGroup?.isPinned
      });
    } catch (error) {
      console.error('Error toggling pin status:', error);
    }
  };

  return { 
    groups, 
    featuredGroup, 
    standardGroups, 
    loading, 
    error,
    handlePinToggle,
    handleJoinActivity
  };
} 