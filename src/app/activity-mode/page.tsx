'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, MapPin, Calendar, User } from 'lucide-react';
import EnhancedActivityCard from '../../components/ui/EnhancedActivityCard';

export default function ActivityModePage() {
  const { user } = useAuth();
  const { startActivity, activeActivity } = useActivity();
  const [planned, setPlanned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    console.log('=== USEEFFECT TRIGGERED ===');
    console.log('User loaded:', !!user?.uid, 'UID:', user?.uid);
    console.log('Current planned state:', planned.length);
    
    // Don't run if user isn't loaded yet
    if (!user?.uid) {
      console.log('User not loaded yet, skipping activity fetch');
      setLoading(false); // Set loading to false even if user not loaded
      return;
    }

    // Prevent concurrent data fetches
    if (isLoadingData) {
      console.log('Data fetch already in progress, skipping');
      return;
    }
    
    (async () => {
      setIsLoadingData(true);
      try {
        const ref = collection(db, 'activities');
        // Include activities where user is a participant OR user is a member of the group
        // First, get the user's group ids from the server (admin-backed for reliability)
        const groupIds: string[] = [];
        const groupInfoById: Record<string, { name: string; coverImage?: string }> = {};
        let groupsApiSuccess = false;
        if (user?.uid) {
          try {
            const resp = await fetch(`/api/my-groups?uid=${encodeURIComponent(user.uid)}`);
            groupsApiSuccess = resp.ok;
            if (resp.ok) {
              const json = await resp.json();
              const groups = Array.isArray(json.groups) ? json.groups : [];
              groups.forEach((g: any) => {
                groupIds.push(g.id);
                groupInfoById[g.id] = { name: g.name || 'Group', coverImage: g.coverImage || '' };
              });
            } else {
              console.error('Groups API error:', resp.status, await resp.text());
            }
          } catch (error) {
            console.error('Groups API fetch error:', error);
          }
        }

        const snap = await getDocs(ref);
        const raw: any[] = [];
        console.log('=== ACTIVITY MODE DEBUG ===');
        console.log('Current user UID:', user?.uid);
        console.log('Total activities found:', snap.size);
        console.log('User groups:', groupIds);
        console.log('Groups API success:', groupsApiSuccess);
        
        snap.forEach((d) => {
          const data = d.data() as any;
          const isPlanned = data.status === 'planned' || data.status === 'active';
          const isParticipant = (data.participants || []).includes(user?.uid);
          const isInMyGroup = groupIds.includes(data.groupId);
          const shouldInclude = isPlanned && (isParticipant || isInMyGroup);
          
          console.log(`Activity ${d.id}:`, {
            title: data.title,
            status: data.status,
            groupId: data.groupId,
            isPlanned,
            isParticipant,
            isInMyGroup,
            shouldInclude,
            participants: data.participants || []
          });
          
          if (shouldInclude) {
            raw.push({ 
              id: d.id, 
              groupName: groupInfoById[data.groupId]?.name || data.groupName || 'Group',
              ...data 
            });
          }
        });
        
        console.log('Filtered activities:', raw.length);
        // Enrich with participant profiles for all RSVP states
        const enriched = await Promise.all(raw.map(async (a) => {
          // Helper function to fetch user profiles
          const fetchProfiles = async (userIds: string[]) => {
            const profiles: Array<{ id: string; name: string; avatarUrl: string }> = [];
            for (const uid of userIds.slice(0, 8)) { // Limit to 8 per state
              try {
                const u = await getDoc(doc(db, 'users', uid));
                if (u.exists()) {
                  const ud: any = u.data();
                  profiles.push({ id: u.id, name: ud.displayName || 'User', avatarUrl: ud.profilePictureUrl || '' });
                } else {
                  profiles.push({ id: uid, name: 'User', avatarUrl: '' });
                }
              } catch {
                profiles.push({ id: uid, name: 'User', avatarUrl: '' });
              }
            }
            return profiles;
          };

          // Fetch profiles for each RSVP state
          const [participantProfiles, interestedProfiles, leftProfiles] = await Promise.all([
            fetchProfiles(a.participants || []),
            fetchProfiles(a.interested || []),
            fetchProfiles(a.left || [])
          ]);

          // Image enrichment
          let imageUrl: string = a.imageUrl || '';
          try {
            if (!imageUrl && a.pollId) {
              const pollSnap = await getDoc(doc(db, 'polls', a.pollId));
              if (pollSnap.exists()) {
                const poll: any = pollSnap.data();
                const options: any[] = Array.isArray(poll.options) ? poll.options : [];
                const withVotes = options.map(o => ({
                  votes: typeof o.votes === 'number' ? o.votes : (o.voters?.length || 0),
                  imageUrl: o.imageUrl || '',
                }));
                const winner = withVotes.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
                if (winner?.imageUrl) imageUrl = winner.imageUrl;
              }
            }
          } catch (e) {
            console.warn('Image enrich via poll failed for', a.id, e);
          }
          if (!imageUrl) {
            imageUrl = groupInfoById[a.groupId]?.coverImage || '';
          }

          return { 
            ...a, 
            participantProfiles, 
            interestedProfiles, 
            leftProfiles, 
            imageUrl 
          };
        }));
        
        console.log('Setting planned activities:', enriched.length);
        setPlanned(enriched);
        console.log('Updated planned state:', enriched.length);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
        setIsLoadingData(false);
      }
    })();
  }, [user?.uid]);

  const mapsBase = 'https://www.google.com/maps/search/?api=1';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  };

  const handleStartActivity = async (activityId: string) => {
    try {
      await startActivity(activityId, user?.uid);
    } catch (error) {
      console.error('Failed to start activity:', error);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-background-secondary opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-content-primary">Live Activities</h1>
            </div>
            <p className="text-content-secondary text-lg">
              Join live activities and connect with your community in real-time
            </p>
            {/* Temporary debug info */}
            <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-400">
              DEBUG - Current User: {user?.uid || 'Not logged in'} | Groups: {planned.length ? 'Data loaded' : 'No data'}
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <TrendingUp className="w-4 h-4 text-accent-primary" />
                <span>{planned.length} activities available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <Users className="w-4 h-4 text-accent-secondary" />
                <span>{planned.reduce((acc, a) => acc + (a.participantProfiles?.length || 0), 0)} people participating</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <Clock className="w-4 h-4 text-accent-muted" />
                <span>Live updates</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Debug render info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-blue-900/20 rounded text-xs text-blue-400">
            RENDER DEBUG - Loading: {loading.toString()} | DataLoading: {isLoadingData.toString()} | Planned: {planned.length} | User: {user?.uid ? 'Loaded' : 'Not loaded'}
          </div>
        )}

        {/* Activities Grid */}
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="liquid-glass p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-background-secondary rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-background-secondary rounded w-2/3"></div>
                    <div className="h-4 bg-background-secondary rounded w-1/2"></div>
                    <div className="h-4 bg-background-secondary rounded w-1/3"></div>
                  </div>
                  <div className="w-32 h-10 bg-background-secondary rounded-lg"></div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : planned.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="liquid-glass p-8 text-center"
          >
            <div className="w-16 h-16 bg-accent-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-content-primary mb-2">No Activities Available</h3>
            <p className="text-content-secondary mb-4">
              Check back soon for new activities, or create one from your group!
            </p>
            {user?.uid && (
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/dev-utils', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'join-all-groups', uid: user.uid })
                    });
                    const result = await response.json();
                    if (result.ok) {
                      alert(`Added to ${result.updatedGroups} groups! Refresh the page to see activities.`);
                      window.location.reload();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    alert('Error: ' + error.message);
                  }
                }}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors"
              >
                Join All Groups (Dev Mode)
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Render polished cards */}
            {planned.map((activity) => (
              <EnhancedActivityCard
                key={activity.id}
                activity={activity}
                onStartActivity={handleStartActivity}
                isActive={activeActivity?.id === activity.id}
                size="large"
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

