'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock } from 'lucide-react';
import FOMOActivityCard from '../../components/ui/FOMOActivityCard';

export default function ActivityModePage() {
  const { user } = useAuth();
  const { startActivity, activeActivity } = useActivity();
  const [planned, setPlanned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ref = collection(db, 'activities');
        // Include activities where user is a participant OR user is a member of the group
        // First, get the user's group ids from the server (admin-backed for reliability)
        const groupIds: string[] = [];
        if (user?.uid) {
          try {
            const resp = await fetch(`/api/my-groups?uid=${encodeURIComponent(user.uid)}`);
            if (resp.ok) {
              const json = await resp.json();
              const groups = Array.isArray(json.groups) ? json.groups : [];
              groups.forEach((g: any) => groupIds.push(g.id));
            }
          } catch {}
        }

        const snap = await getDocs(ref);
        const raw: any[] = [];
        console.log('Total activities found:', snap.size);
        console.log('User groups:', groupIds);
        
        snap.forEach((d) => {
          const data = d.data() as any;
          const isPlanned = data.status === 'planned' || data.status === 'active';
          const isParticipant = (data.participants || []).includes(user?.uid);
          const isInMyGroup = groupIds.includes(data.groupId);
          
          console.log(`Activity ${d.id}:`, {
            status: data.status,
            isPlanned,
            isParticipant,
            isInMyGroup,
            groupId: data.groupId,
            participants: data.participants
          });
          
          if (isPlanned && (isParticipant || isInMyGroup)) {
            raw.push({ id: d.id, ...data });
          }
        });
        
        console.log('Filtered activities:', raw.length);
        // Enrich with participant profiles (up to 6) for avatar display
        const enriched = await Promise.all(raw.map(async (a) => {
          const pids: string[] = Array.isArray(a.participants) ? a.participants.slice(0, 6) : [];
          const profiles: Array<{ id: string; name: string; avatarUrl: string }> = [];
          for (const pid of pids) {
            try {
              const u = await getDoc(doc(db, 'users', pid));
              if (u.exists()) {
                const ud: any = u.data();
                profiles.push({ id: u.id, name: ud.displayName || 'User', avatarUrl: ud.profilePictureUrl || '' });
              } else {
                profiles.push({ id: pid, name: 'User', avatarUrl: '' });
              }
            } catch {
              profiles.push({ id: pid, name: 'User', avatarUrl: '' });
            }
          }
          return { ...a, participantProfiles: profiles };
        }));
        setPlanned(enriched);
      } finally {
        setLoading(false);
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {planned.map((activity) => (
              <motion.div key={activity.id} variants={itemVariants}>
                <FOMOActivityCard
                  activity={activity}
                  onStartActivity={handleStartActivity}
                  isActive={activeActivity?.id === activity.id}
                  size="large"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

