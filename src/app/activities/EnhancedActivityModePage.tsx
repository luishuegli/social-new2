'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useEnhancedActivity } from '../contexts/EnhancedActivityContext';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, RefreshCw } from 'lucide-react';
import FOMOActivityCard from '../../components/ui/FOMOActivityCard';

export default function EnhancedActivityModePage() {
  const { user } = useAuth();
  const { 
    userActivities, 
    userActivitiesLoading, 
    startActivity, 
    activeActivity,
    refreshActivities 
  } = useEnhancedActivity();

  // Filter for planned and active activities
  const availableActivities = useMemo(() => {
    return userActivities.filter(activity => 
      activity.status === 'planned' || activity.status === 'active'
    );
  }, [userActivities]);

  // Statistics
  const stats = useMemo(() => {
    const totalParticipants = availableActivities.reduce(
      (sum, activity) => sum + activity.participants.length, 
      0
    );
    
    const activeCount = availableActivities.filter(a => a.status === 'active').length;
    const plannedCount = availableActivities.filter(a => a.status === 'planned').length;

    return {
      totalActivities: availableActivities.length,
      totalParticipants,
      activeCount,
      plannedCount
    };
  }, [availableActivities]);

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
      // Could add toast notification here
    }
  };

  const handleRefresh = () => {
    refreshActivities();
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-content-primary">Live Activities</h1>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={userActivitiesLoading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-content-primary transition-colors disabled:opacity-50"
                title="Refresh activities"
              >
                <RefreshCw className={`w-5 h-5 ${userActivitiesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <p className="text-content-secondary text-lg">
              Join live activities and connect with your community in real-time
            </p>
            
            {/* Enhanced Stats */}
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <TrendingUp className="w-4 h-4 text-accent-primary" />
                <span>{stats.totalActivities} activities available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <Users className="w-4 h-4 text-accent-secondary" />
                <span>{stats.totalParticipants} people participating</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <Zap className="w-4 h-4 text-accent-primary" />
                <span>{stats.activeCount} live now</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-content-secondary">
                <Clock className="w-4 h-4 text-accent-muted" />
                <span>Real-time updates</span>
              </div>
            </div>

            {/* Active Activity Indicator */}
            {activeActivity && (
              <div className="mt-4 p-3 bg-accent-primary/20 rounded-lg border border-accent-primary/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-accent-primary">
                    Currently active: {activeActivity.title}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activities Grid */}
        {userActivitiesLoading ? (
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
        ) : availableActivities.length === 0 ? (
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Active Activities First */}
            {availableActivities
              .filter(activity => activity.status === 'active')
              .map((activity) => (
                <motion.div key={activity.id} variants={itemVariants}>
                  <FOMOActivityCard
                    activity={activity}
                    onStartActivity={handleStartActivity}
                    isActive={activeActivity?.id === activity.id}
                    size="large"
                  />
                </motion.div>
              ))}
            
            {/* Planned Activities */}
            {availableActivities
              .filter(activity => activity.status === 'planned')
              .map((activity) => (
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

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs text-gray-300">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <p>User ID: {user?.uid}</p>
            <p>Total Activities: {userActivities.length}</p>
            <p>Available Activities: {availableActivities.length}</p>
            <p>Loading: {userActivitiesLoading.toString()}</p>
            <p>Active Activity: {activeActivity?.id || 'None'}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
