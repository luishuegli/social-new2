'use client';

import React, { useState } from 'react';
import { MatchResult, CoreInterest, DiscoveryPhoto } from '@/app/types/firestoreSchema';
import { 
  Sparkles, 
  MapPin, 
  Globe, 
  Users, 
  Zap, 
  Calendar,
  MessageCircle,
  Coffee,
  Gamepad2,
  Music,
  Camera,
  X,
  Heart
} from 'lucide-react';
import PhotoCarousel from './PhotoCarousel';

interface StoryCardProps {
  match: MatchResult;
  onConnect: (targetId: string, message?: string) => void;
  onSkip: () => void;
  onSwipeRight: () => void;
  connectionTokens: number;
  isTopCard?: boolean;
  canSwipe?: boolean;
  isAnimating?: boolean;
  isDailyTopPick?: boolean;
}

const ICEBREAKER_TEMPLATES = [
  { icon: Coffee, text: "Let's grab coffee and chat about", prompt: "coffee" },
  { icon: Gamepad2, text: "Want to play together?", prompt: "gaming" },
  { icon: Music, text: "Share our favorite tracks?", prompt: "music" },
  { icon: Camera, text: "Photo walk this weekend?", prompt: "photography" },
];

export default function StoryCard({ 
  match, 
  onConnect, 
  onSkip,
  onSwipeRight,
  connectionTokens,
  isTopCard,
  canSwipe = true,
  isAnimating = false,
  isDailyTopPick = false
}: StoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get archetype color and icon
  const getArchetypeStyle = (archetype: string) => {
    switch (archetype) {
      case 'creator':
        return { color: 'from-purple-500 to-pink-500', icon: '🎨' };
      case 'explorer':
        return { color: 'from-blue-500 to-cyan-500', icon: '🧭' };
      case 'organizer':
        return { color: 'from-orange-500 to-red-500', icon: '📋' };
      case 'participant':
        return { color: 'from-green-500 to-emerald-500', icon: '🎭' };
      default:
        return { color: 'from-gray-500 to-gray-600', icon: '👤' };
    }
  };

  // Get social tempo display
  const getSocialTempoDisplay = (tempo: string) => {
    switch (tempo) {
      case 'one-on-one':
        return '1-on-1 conversations';
      case 'small-group':
        return 'Small group hangouts';
      case 'large-group':
        return 'Large social gatherings';
      default:
        return 'Flexible social settings';
    }
  };

  // Get connection intent display
  const getConnectionIntentDisplay = (intent: string) => {
    switch (intent) {
      case 'spontaneous':
        return 'Spontaneous meetups';
      case 'planned':
        return 'Planned activities';
      case 'both':
        return 'Both spontaneous & planned';
      default:
        return 'Open to connections';
    }
  };

  const archetypeStyle = getArchetypeStyle(match.profile.dna?.archetype || '');
  const sharedInterests = match.sharedInterests || [];

  // Generate appropriate icebreakers based on shared interests
  const generateIcebreakers = () => {
    const icebreakers = [];
    
    if (sharedInterests.some(i => i.tag.includes('coffee'))) {
      icebreakers.push(ICEBREAKER_TEMPLATES[0]);
    }
    if (sharedInterests.some(i => i.tag.includes('game') || i.tag.includes('valorant'))) {
      icebreakers.push(ICEBREAKER_TEMPLATES[1]);
    }
    if (sharedInterests.some(i => i.tag.includes('music'))) {
      icebreakers.push(ICEBREAKER_TEMPLATES[2]);
    }
    if (sharedInterests.some(i => i.tag.includes('photo'))) {
      icebreakers.push(ICEBREAKER_TEMPLATES[3]);
    }
    
    // If no specific matches, show generic options
    if (icebreakers.length === 0) {
      icebreakers.push(
        { icon: MessageCircle, text: "Hey! We have a lot in common", prompt: "general" },
        { icon: Coffee, text: "Let's connect over coffee", prompt: "coffee" }
      );
    }
    
    return icebreakers.slice(0, 3); // Return max 3 icebreakers
  };

  const icebreakers = generateIcebreakers();

  return (
    <div className="liquid-glass rounded-xl shadow-xl overflow-hidden border border-gray-200/20 dark:border-gray-700/20">
      {/* Daily Top Pick Banner */}
      {isDailyTopPick && (
        <div className="bg-gradient-to-r from-accent-primary/20 to-purple-500/20 border-b border-accent-primary/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-accent-primary" />
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-primary">Daily Top Pick</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-primary">{match.score}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">match</div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Avatar and Match Score */}
      <div className="relative h-80 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600">
        {/* Match Score Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="liquid-glass rounded-full px-4 py-2 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span className="font-bold text-lg text-content-primary">{match.score}%</span>
            </div>
          </div>
        </div>

        {/* Archetype Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`bg-gradient-to-r ${archetypeStyle.color} text-white rounded-full px-4 py-2 shadow-lg border border-white/20`}>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{archetypeStyle.icon}</span>
              <span className="font-semibold capitalize">{match.profile.dna?.archetype}</span>
            </div>
          </div>
        </div>

        {/* Profile Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {match.profile.photoURL ? (
            <img 
              src={match.profile.photoURL} 
              alt={match.profile.displayName || match.profile.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/80 dark:border-gray-700/80 shadow-xl backdrop-blur-sm"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl border-4 border-white/80 dark:border-gray-700/80">
              <span className="text-4xl text-white font-bold">
                {(match.profile.displayName || match.profile.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Spark Title */}
        {match.sparkTitle && (
          <div className="absolute bottom-4 left-0 right-0 text-center px-4">
            <div className="liquid-glass rounded-lg px-4 py-2 border border-white/20 dark:border-gray-700/20">
              <p className="text-lg font-medium text-content-primary">
                "{match.sparkTitle}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6">
        {/* Name and Username */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-content-primary">
            {match.profile.displayName || match.profile.username}
          </h2>
          {match.profile.displayName && match.profile.username && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{match.profile.username}
            </p>
          )}
        </div>

        {/* Bio */}
        {match.profile.bio && (
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6 px-4">
            {match.profile.bio}
          </p>
        )}

        {/* Shared Interests */}
        {sharedInterests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Shared Interests ({sharedInterests.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {sharedInterests.map((interest) => (
                <span 
                  key={interest.tag}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${interest.passion === 'pro' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : interest.passion === 'passionate'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {interest.tag.replace('#', '')}
                  {interest.type === 'in-person' && ' 🤝'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connection Preferences */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{getSocialTempoDisplay(match.profile.dna?.socialTempo || '')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{getConnectionIntentDisplay(match.profile.dna?.connectionIntent || '')}</span>
          </div>
          {match.profile.dna?.languages && match.profile.dna.languages.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 col-span-2">
              <Globe className="w-4 h-4" />
              <span>Speaks {match.profile.dna.languages.join(', ').toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Message Option */}
        <div className="mt-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-content-primary transition-colors border border-gray-200/30 dark:border-gray-700/30 rounded-lg liquid-glass"
          >
            {showDetails ? 'Hide message option' : 'Send a personalized message'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 p-4 liquid-glass rounded-lg border border-gray-200/30 dark:border-gray-700/30">
            <textarea
              placeholder="Write a personalized message..."
              className="w-full p-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 liquid-glass text-content-primary resize-none placeholder-gray-500 dark:placeholder-gray-400 mb-3"
              rows={3}
            />
            <button
              onClick={() => onConnect(match.profile.uid!, 'custom')}
              disabled={false}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Send Connection Request
            </button>
          </div>
        )}

      </div>

      {/* Swipe Controls */}
      <div className="flex justify-center items-center space-x-8 mt-8 mb-6">
        <button
          onClick={onSkip}
          disabled={!canSwipe || isAnimating}
          className="p-4 rounded-lg liquid-glass shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200/30 dark:border-red-700/30"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>

        <button
          onClick={onSwipeRight}
          disabled={!canSwipe || isAnimating || showDetails}
          className="p-5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
        >
          <Heart className="w-10 h-10 text-white" />
        </button>
      </div>
    </div>
  );
}
