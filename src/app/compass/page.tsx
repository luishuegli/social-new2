'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { MatchResult } from '@/app/types/firestoreSchema';
import DiscoveryCardDeck from '@/components/compass/DiscoveryCardDeck';
import InterestChannels from '@/components/compass/InterestChannels';
import AppLayout from '@/app/components/AppLayout';
import { Sparkles, RefreshCw, Heart, Zap, Users } from 'lucide-react';

export default function CompassPage() {
  const { user, firebaseUser } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [connectionTokens, setConnectionTokens] = useState<number>(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check if user's vector is initialized
  const checkInitialization = useCallback(async () => {
    if (!user || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/compass/initialize-vector', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionTokens(data.connectionTokens || 0);
        return data.initialized;
      }
    } catch (error) {
      console.error('Error checking initialization:', error);
    }
    return false;
  }, [user, firebaseUser]);

  // Fetch matches from the discovery API
  const fetchMatches = useCallback(async () => {
    if (!user || !firebaseUser) return;

    setLoading(true);
    setError(null);
    setNeedsOnboarding(false);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/compass/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          interestFilter: selectedInterest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresOnboarding) {
          setNeedsOnboarding(true);
          setMatches([]);
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch matches');
      }

      const data = await response.json();

      if (data.status === 'NEEDS_ONBOARDING') {
        setNeedsOnboarding(true);
        setMatches([]);
      } else {
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, selectedInterest, firebaseUser]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, fetchMatches]);

  // Handle connect or skip action
  const handleAction = async (targetId: string, action: 'connect' | 'skip') => {
    console.log(`handleAction called: targetId=${targetId}, action=${action}`);
    if (!user || !firebaseUser) {
      console.log('No user or firebaseUser, skipping action');
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      console.log(`Sending action to API: ${action} on ${targetId}`);
      const response = await fetch('/api/compass/log-swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId,
          action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (action === 'connect' && data.remainingTokens !== undefined) {
          setConnectionTokens(data.remainingTokens);
        }
        
        // Remove the match from the list
        setMatches(prev => prev.filter(m => m.profile.uid !== targetId));
        
        // Fetch more matches if running low
        if (matches.length <= 3) {
          fetchMatches();
        }
      } else {
        const errorData = await response.json();
        if (errorData.requiresTokens) {
          setError('You\'ve used all your connection requests for today. They refresh every 24 hours!');
        }
      }
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Handle interest channel selection
  const handleInterestSelect = (interest: string | null) => {
    setSelectedInterest(interest);
  };

  // Refresh matches
  const handleRefresh = () => {
    fetchMatches();
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to access Connection Hub</h2>
        </div>
      </AppLayout>
    );
  }

  if (needsOnboarding) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Sparkles className="w-24 h-24 mx-auto mb-8 text-content-primary" />
            <h1 className="text-5xl font-bold mb-6">Tell us what you love!</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
              Complete your profile to find meaningful connections and authentic friendships.
            </p>
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="px-12 py-4 text-lg liquid-glass text-content-primary rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Complete Your Profile
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-full">
      {/* Unified Header with Interest Channels */}
      <div className="liquid-glass sticky top-0 z-10 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="container mx-auto px-6 py-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-content-primary" />
              <h1 className="text-2xl font-bold text-content-primary">Connection Hub</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-lg liquid-glass hover:opacity-80 transition-opacity border border-gray-200/20 dark:border-gray-700/20"
              >
                <RefreshCw className={`w-5 h-5 text-content-primary ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interest Channels Section */}
          <InterestChannels 
            onSelectInterest={handleInterestSelect}
            selectedInterest={selectedInterest}
            isEmbedded={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-32 pb-12 relative">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-pulse">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-content-primary" />
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Finding your perfect friend matches...</p>
            </div>
          </div>
        ) : matches.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            {/* Discovery Card Deck */}
            <DiscoveryCardDeck
              matches={matches}
              onSwipe={handleAction}
              connectionTokens={connectionTokens}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No new connections available right now</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Check back later or try exploring different interest channels
              </p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 liquid-glass text-content-primary rounded-lg hover:opacity-90 transition-opacity"
              >
                Discover New Friends
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
}
