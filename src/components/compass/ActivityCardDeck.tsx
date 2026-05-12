'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import ActivityCard from './ActivityCard';
import { Calendar, Sparkles } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description?: string;
  date: string | Date;
  location?: string;
  groupName?: string;
  groupId?: string;
  attendeeCount?: number;
  attendees?: Array<{ photoURL?: string; displayName?: string }>;
  maxAttendees?: number;
}

export default function ActivityCardDeck() {
  const { firebaseUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/compass/activities', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch activities';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Activities fetched:', data); // Debug log
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (activityId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityId,
          action: 'join',
          userId: firebaseUser.uid,
          groupId: activities.find(a => a.id === activityId)?.groupId || '',
        }),
      });

      if (response.ok) {
        // Remove the activity from the list since user has joined
        setActivities(prev => prev.filter(a => a.id !== activityId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join activity');
      }
    } catch (error) {
      console.error('Error joining activity:', error);
      alert('Failed to join activity. Please try again.');
    }
  };

  const handleViewDetails = (activityId: string) => {
    // Navigate to activity details or open a modal
    const activity = activities.find(a => a.id === activityId);
    if (activity?.groupId) {
      window.location.href = `/groups/${activity.groupId}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-pulse">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-content-primary" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Finding activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-2 text-content-primary">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchActivities}
            className="px-6 py-2 liquid-glass text-content-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-content-primary">No new activities found right now</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check back later or create your own activity in a group!
          </p>
          <button
            onClick={fetchActivities}
            className="px-6 py-2 liquid-glass text-content-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-content-primary mb-2 flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-accent-primary" />
          <span>Discover Activities</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Join activities from groups you're not a member of yet
        </p>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onJoin={handleJoin}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

