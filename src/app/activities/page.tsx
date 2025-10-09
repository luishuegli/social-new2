'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { collection, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, List, Calendar as CalendarIcon } from 'lucide-react';
import EnhancedActivityCard from '../../components/ui/EnhancedActivityCard';
import CalendarView from '../components/CalendarView';
import { dataService } from '../lib/dataService';

interface Activity extends DocumentData {
  id: string;
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { startActivity, activeActivity } = useActivity();
  const [planned, setPlanned] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

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
        
        // Use the data service to get group information
        const myGroups = await dataService.getMyGroups(user.uid);
        const groupIds = myGroups.map(g => g.id);
        const groupInfoById = myGroups.reduce((acc, g) => {
          acc[g.id] = { name: g.name || 'Group', coverImage: g.coverImage || '' };
          return acc;
        }, {});

        const snap = await getDocs(ref);
        const raw: any[] = [];
        console.log('=== ACTIVITY MODE DEBUG ===');
        console.log('Current user UID:', user?.uid);
        console.log('Total activities found:', snap.size);
        console.log('User groups:', groupIds);
        
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
              type: 'group',
              ...data 
            });
          }
        });
        
        console.log('Filtered group activities:', raw.length);

        // Fetch solo activities
        try {
          const soloResponse = await fetch(`/api/activities/solo?userId=${user.uid}`);
          if (soloResponse.ok) {
            const soloActivities = await soloResponse.json();
            console.log('Solo activities fetched:', soloActivities.length);
            
            // Transform solo activities to match the expected format
            soloActivities.forEach((solo: any) => {
              raw.push({
                id: solo.id,
                title: solo.title,
                description: solo.description || '',
                date: solo.date,
                status: 'planned',
                type: 'solo',
                userId: solo.userId,
                groupName: 'Solo Activity',
                participants: [user.uid],
                participantProfiles: [{
                  id: user.uid,
                  name: user.displayName || 'You',
                  avatarUrl: user.profilePictureUrl || ''
                }],
                interested: [],
                left: [],
                interestedProfiles: [],
                leftProfiles: []
              });
            });
          }
        } catch (error) {
          console.error('Error fetching solo activities:', error);
        }
        
        console.log('Total activities (group + solo):', raw.length);
        // Enrich with participant profiles for all RSVP states (skip solo activities as they're already enriched)
        const enriched = await Promise.all(raw.map(async (a) => {
          // Skip enrichment for solo activities as they're already formatted
          if (a.type === 'solo') {
            return a;
          }
          
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
  }, [user?.uid, isLoadingData]);

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

  const handleActivityUpdate = (updatedActivity: Activity) => {
    // Update the activity in the planned array
    setPlanned(prev => prev.map(activity => 
      activity.id === updatedActivity.id ? updatedActivity : activity
    ));
  };

  const handleRefreshActivities = () => {
    // Force a refresh by resetting loading state
    // This will trigger the useEffect to refetch data
    setIsLoadingData(false);
    setLoading(true);
    
    // Small delay to ensure state update is processed
    setTimeout(() => {
      setIsLoadingData(false);
    }, 100);
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
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-content-primary">Activities</h1>
            </div>
            <p className="text-content-secondary text-lg">
              Browse upcoming activities or view your schedule on the calendar.
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

        {/* View Toggle - Matching Action Center Style */}
        <div className="mb-6">
          <div className="liquid-glass p-4">
            <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-1">
              <button
                onClick={() => setView('list')}
                className={`
                  flex-1 px-6 py-3 rounded-lg text-body font-semibold transition-all duration-200
                  focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                  active:outline-none active:ring-0 active:border-0 active:shadow-none
                  ${view === 'list'
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                  }
                `}
                style={{ outline: 'none' }}
              >
                <List className="w-5 h-5 inline-block mr-2" />
                List View
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`
                  flex-1 px-6 py-3 rounded-lg text-body font-semibold transition-all duration-200
                  focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                  active:outline-none active:ring-0 active:border-0 active:shadow-none
                  ${view === 'calendar'
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                  }
                `}
                style={{ outline: 'none' }}
              >
                <CalendarIcon className="w-5 h-5 inline-block mr-2" />
                Calendar View
              </button>
            </div>
          </div>
        </div>

        {/* Debug render info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-blue-900/20 rounded text-xs text-blue-400">
            RENDER DEBUG - Loading: {loading.toString()} | DataLoading: {isLoadingData.toString()} | Planned: {planned.length} | User: {user?.uid ? 'Loaded' : 'Not loaded'}
          </div>
        )}

        {/* Conditional Content */}
        {view === 'list' && (
          <>
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
                        alert('Error: ' + (error instanceof Error ? error.message : String(error)));
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
                    onActivityUpdate={handleActivityUpdate}
                    isActive={activeActivity?.id === activity.id}
                    size="large"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'calendar' && (
          <CalendarView 
            activities={planned} 
            onActivityCreated={handleRefreshActivities}
          />
        )}
      </div>
    </AppLayout>
  );
}

