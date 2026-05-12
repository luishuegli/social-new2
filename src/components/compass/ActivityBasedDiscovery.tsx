'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { MatchResult, UserProfile } from '@/app/types/firestoreSchema';
import { Sparkles, Users, Search } from 'lucide-react';
import StoryCard from './StoryCard';
import ProfilePreviewModal from './ProfilePreviewModal';

interface Activity {
  tag: string;
  displayName: string;
  count: number;
}

interface ActivityBasedDiscoveryProps {
  onSwipe: (targetId: string, action: 'connect' | 'skip', message?: string) => void;
  connectionTokens: number;
}

export default function ActivityBasedDiscovery({ onSwipe, connectionTokens }: ActivityBasedDiscoveryProps) {
  const { user, firebaseUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
  const [selectedMatchScore, setSelectedMatchScore] = useState<number>(0);

  // Popular activities to discover by
  const popularActivities: Activity[] = [
    { tag: '#golf', displayName: '⛳ Golf', count: 0 },
    { tag: '#coding', displayName: '💻 Coding', count: 0 },
    { tag: '#hiking', displayName: '🥾 Hiking', count: 0 },
    { tag: '#gaming', displayName: '🎮 Gaming', count: 0 },
    { tag: '#photography', displayName: '📸 Photography', count: 0 },
    { tag: '#cooking', displayName: '🍳 Cooking', count: 0 },
    { tag: '#fitness', displayName: '💪 Fitness', count: 0 },
    { tag: '#music', displayName: '🎵 Music', count: 0 },
    { tag: '#reading', displayName: '📚 Reading', count: 0 },
    { tag: '#travel', displayName: '✈️ Travel', count: 0 },
    { tag: '#art', displayName: '🎨 Art', count: 0 },
    { tag: '#yoga', displayName: '🧘 Yoga', count: 0 },
  ];

  useEffect(() => {
    setActivities(popularActivities);
    setLoading(false);
  }, []);

  const fetchPeopleByActivity = async (activityTag: string) => {
    if (!user || !firebaseUser) return;

    setLoading(true);
    setError(null);
    setCurrentIndex(0);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/compass/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          interestFilter: activityTag,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch people');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity.tag);
    fetchPeopleByActivity(activity.tag);
  };

  const handleBack = () => {
    setSelectedActivity(null);
    setMatches([]);
    setCurrentIndex(0);
  };

  const handleSwipe = (targetId: string, action: 'connect' | 'skip', message?: string) => {
    onSwipe(targetId, action, message);
    
    // Move to next card
    if (action === 'connect' || action === 'skip') {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleViewProfile = (match: MatchResult) => {
    setSelectedUser(match.profile);
    setSelectedMatchScore(match.score);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleModalConnect = async (userId: string, message?: string) => {
    // Close modal first
    setSelectedUser(null);
    
    // Then perform the connect action
    handleSwipe(userId, 'connect', message);
  };

  const currentMatch = matches[currentIndex];

  // Activity selection view
  if (!selectedActivity) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-accent-primary" />
          <h2 className="text-3xl font-bold text-content-primary mb-3">
            Find People by Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover people who share your interests and activities. Connect with golfers, coders, hikers, and more!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activities.map((activity) => (
            <button
              key={activity.tag}
              onClick={() => handleActivitySelect(activity)}
              className="liquid-glass rounded-xl p-6 border border-gray-200/20 dark:border-gray-700/20 hover:border-accent-primary/50 transition-all hover:scale-105 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">
                  {activity.displayName.split(' ')[0]}
                </div>
                <h3 className="text-lg font-semibold text-content-primary group-hover:text-accent-primary transition-colors">
                  {activity.displayName.split(' ').slice(1).join(' ')}
                </h3>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 p-6 liquid-glass rounded-xl border border-gray-200/20 dark:border-gray-700/20">
          <div className="flex items-start space-x-4">
            <Search className="w-6 h-6 text-accent-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-content-primary mb-2">
                How It Works
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Choose an activity you're interested in</li>
                <li>• Browse people who share that interest</li>
                <li>• Connect with those who match your vibe</li>
                <li>• Start conversations about your shared passion!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // People discovery view
  const selectedActivityData = activities.find(a => a.tag === selectedActivity);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back button and header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-content-primary transition-colors mb-4"
        >
          <span>←</span>
          <span>Back to activities</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="text-4xl">
            {selectedActivityData?.displayName.split(' ')[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-content-primary">
              {selectedActivityData?.displayName.split(' ').slice(1).join(' ')} Enthusiasts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {matches.length} {matches.length === 1 ? 'person' : 'people'} found
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-pulse">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-content-primary" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Finding people...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-32">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-content-primary">No one found yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Be the first to add this interest to your profile!
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 liquid-glass text-content-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Another Activity
          </button>
        </div>
      )}

      {/* People cards */}
      {!loading && !error && currentMatch && (
        <div>
          <StoryCard
            match={currentMatch}
            onConnect={(targetId, message) => handleSwipe(targetId, 'connect', message)}
            onSkip={() => handleSwipe(currentMatch.profile.uid!, 'skip')}
            connectionTokens={connectionTokens}
            isTopCard={true}
            isAnimating={false}
            isDailyTopPick={false}
            onViewProfile={() => handleViewProfile(currentMatch)}
          />

          {/* View Full Profile Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => handleViewProfile(currentMatch)}
              className="px-4 py-2 text-sm liquid-glass text-content-primary rounded-lg hover:opacity-80 transition-opacity border border-gray-200/20 dark:border-gray-700/20"
            >
              View Full Profile
            </button>
          </div>

          {/* Progress */}
          {matches.length > 1 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentIndex + 1} of {matches.length} people
              </p>
              <div className="flex justify-center gap-1.5 mt-3">
                {matches.slice(0, Math.min(matches.length, 10)).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-accent-primary'
                        : index < currentIndex
                        ? 'w-1.5 bg-gray-400 dark:bg-gray-600'
                        : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {currentIndex >= matches.length - 1 && matches.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Explore More Activities
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile Preview Modal */}
      {selectedUser && (
        <ProfilePreviewModal
          user={selectedUser}
          matchScore={selectedMatchScore}
          sharedInterests={currentMatch?.sharedInterests || []}
          onClose={handleCloseModal}
          onConnect={handleModalConnect}
        />
      )}
    </div>
  );
}

