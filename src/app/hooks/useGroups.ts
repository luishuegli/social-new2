'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Group, LatestActivity } from '../types';

const isDevelopment = process.env.NODE_ENV === 'development';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [featuredGroup, setFeaturedGroup] = useState<Group | null>(null);
  const [standardGroups, setStandardGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
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

    // Always use Firestore (even in development) so UI reflects real data

    try {
      // 1) Server hydration via Admin SDK to avoid client connectivity issues
      (async () => {
        try {
          const resp = await fetch(`/api/my-groups?uid=${encodeURIComponent(user.uid)}`);
          if (resp.ok) {
            const json = await resp.json();
            const srvGroups = (json.groups || []) as any[];
            if (srvGroups.length > 0) {
              // Ensure we only use groups where the user is actually a member
              const cleaned = (srvGroups.filter((g: any) => g.isMember === true)) as unknown as Group[];
              setGroups(cleaned);
              setStandardGroups(cleaned);
              setFeaturedGroup(cleaned[0] || null);
              setLoading(false);
            }
          }
        } catch {}
      })();

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
          // If snapshot is empty, keep current (server-hydrated) groups to avoid flicker
          if (snapshot.empty) {
            setLoading(false);
            return;
          }
          const groupsData: Group[] = [];
          
          const groupIdToMemberIds = new Map<string, string[]>();

          snapshot.forEach((doc) => {
            const data = doc.data();
            // Clean up placeholder names like "City Explorers 8" → "City Explorers"
            const cleanedName = (data.groupName || 'Unknown Group').replace(/\s+\d+$/, '');
            
            const group: Group = {
              id: doc.id,
              name: cleanedName, // display clean name without numeric suffix
              description: data.description || 'No description available',
              memberCount: data.members?.length || 0, // Updated to use members array length
              members: [], // will be resolved below
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
              coverImage: data.profilePictureUrl, // Updated to use profilePictureUrl
              isPinned: data.isPinned || false,
            };

            groupsData.push(group);
            groupIdToMemberIds.set(doc.id, (data.members || []) as string[]);
          });

          // Enrich groups with top member profiles prioritized by last activity,
          // then by seniority (earliest joiners first, if join dates exist)
          const enrichedGroupsPromise = groupsData.map(async (group) => {
            try {
              // fetch last few active message senders
              const messagesRef = collection(db, 'groups', group.id, 'messages');
              const msgsSnap = await getDocs(query(messagesRef, orderBy('timestamp', 'desc'), limit(10)));
              const recentSenderIds: string[] = [];
              msgsSnap.forEach((m) => {
                const sid = (m.data() as any).senderId;
                if (sid && !recentSenderIds.includes(sid)) recentSenderIds.push(sid);
              });

              // Compute latest activity from messages
              let latestActivity: LatestActivity | undefined = undefined;
              let latestActorId: string | undefined = undefined;
              const latestMsgDoc = msgsSnap.docs[0];
              if (latestMsgDoc) {
                const md: any = latestMsgDoc.data();
                const isPoll = md.type === 'poll_message' || md.type === 'ai_suggestions' || md.type === 'image_poll' || md.type === 'manual_poll';
                latestActivity = {
                  type: isPoll ? ('poll' as const) : ('message' as const),
                  author: md.senderName,
                  content: String(md.content || '').trim(),
                  timestamp: md.timestamp?.toDate?.() || new Date(),
                  imageUrl: undefined,
                  pollQuestion: isPoll ? (md.metadata?.pollTitle || md.content || '') : undefined,
                } as unknown as LatestActivity;
                latestActorId = md.senderId || undefined;
              }

              // Compare with latest post in this group
              try {
                const postsRef = collection(db, 'posts');
                const postSnap = await getDocs(query(postsRef, where('groupId', '==', group.id), orderBy('timestamp', 'desc'), limit(1)));
                const latestPostDoc = postSnap.docs[0];
                if (latestPostDoc) {
                  const pd: any = latestPostDoc.data();
                  const postTs = pd.timestamp?.toDate?.() || new Date(0);
                  const msgTs = latestActivity?.timestamp ? new Date(latestActivity.timestamp as any) : new Date(0);
                  if (postTs > msgTs) {
                    latestActivity = {
                      type: 'post' as const,
                      author: pd.authorName,
                      content: pd.description || pd.activityTitle || 'New post',
                      timestamp: postTs,
                      imageUrl: Array.isArray(pd.media) ? (pd.media?.[0]?.url || undefined) : (pd.imageUrl || undefined),
                      pollQuestion: undefined,
                    } as unknown as LatestActivity;
                    latestActorId = pd.authorId || undefined;
                  }
                }
              } catch {}
              // Seniority (join dates) if available in subcollection `groups/{id}/members/{uid}.joinedAt`
              let memberIds: string[] = groupIdToMemberIds.get(group.id) || [];
              let latestJoinUid: string | undefined = undefined;
              let latestJoinMs: number = 0;
              try {
                const membersRef = collection(db, 'groups', group.id, 'members');
                const membersSnap = await getDocs(membersRef);
                if (!membersSnap.empty) {
                  const ordered = membersSnap
                    .docs
                    .map(d => {
                      const ts = (d.data() as any)?.joinedAt?.toMillis?.() || 0;
                      if (ts > latestJoinMs) { latestJoinMs = ts; latestJoinUid = d.id; }
                      return ({ id: d.id, joinedAt: ts });
                    })
                    .sort((a, b) => a.joinedAt - b.joinedAt)
                    .map(d => d.id);
                  if (ordered.length > 0) memberIds = ordered;
                }
              } catch {}

              // Prioritize last actor first, then other recent senders, then by seniority
              let prioritized = recentSenderIds.concat(memberIds).filter((v, i, a) => a.indexOf(v) === i);
              if (latestActorId) {
                prioritized = [latestActorId].concat(prioritized.filter((id) => id !== latestActorId));
              }
              if (latestJoinUid && !prioritized.includes(latestJoinUid)) {
                prioritized.unshift(latestJoinUid);
              }

              const selectedIds = prioritized.slice(0, 6);
              const profiles: any[] = [];
              for (const uid of selectedIds) {
                // query by document id directly
                const userDoc = doc(db, 'users', uid);
                // Firestore does not allow '__name__' 'in' queries for single id easily across batch here; do individual get
                const single = await import('firebase/firestore').then(({ getDoc }) => getDoc(userDoc));
                if (single.exists()) {
                  const ud: any = single.data();
                  profiles.push({ id: single.id, name: ud.displayName, avatarUrl: ud.profilePictureUrl });
                } else {
                  profiles.push({ id: uid, name: 'User', avatarUrl: '' });
                }
              }
              // If the most recent join is newer than latest message/post, surface it as activity
              try {
                const currentTs = latestActivity?.timestamp ? new Date(latestActivity.timestamp as any).getTime() : 0;
                if (latestJoinMs && latestJoinMs > currentTs) {
                  const joinedProfile = profiles.find(p => p.id === latestJoinUid);
                  latestActivity = {
                    type: 'join' as const,
                    author: joinedProfile?.name || 'Someone',
                    content: 'joined the group',
                    timestamp: new Date(latestJoinMs),
                    imageUrl: undefined,
                    pollQuestion: undefined,
                  } as unknown as LatestActivity;
                }
              } catch {}

              return { ...group, members: profiles, latestActivity: latestActivity || group.latestActivity } as Group;
            } catch {
              return group;
            }
          });

          Promise.all(enrichedGroupsPromise).then(async (enrichedGroups) => {
            // Sort groups: pinned first, then by activity date
          const sortedGroups = enrichedGroups.sort((a, b) => {
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

            // Do not auto-join in production; keep UI consistent with server state
          
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
          });
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
      setError('Failed to load groups. Please check your connection and try again.');
      setLoading(false);
    }
  }, [user, retryCount]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
  }, []);

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
    retry,
    handlePinToggle,
    handleJoinActivity
  };
} 