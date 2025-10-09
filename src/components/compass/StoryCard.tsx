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
  UserPlus,
  Palette,
  Compass,
  ClipboardList,
  Star
} from 'lucide-react';
import PhotoCarousel from './PhotoCarousel';

interface StoryCardProps {
  match: MatchResult;
  onConnect: (targetId: string, message?: string) => void;
  onSkip: () => void;
  connectionTokens: number;
  isTopCard?: boolean;
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
  connectionTokens,
  isTopCard,
  isAnimating = false,
  isDailyTopPick = false
}: StoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  
  // Get archetype color and icon
  const getArchetypeStyle = (archetype: string) => {
    switch (archetype) {
      case 'creator':
        return { color: 'from-gray-600 to-gray-700', icon: Palette };
      case 'explorer':
        return { color: 'from-gray-600 to-gray-700', icon: Compass };
      case 'organizer':
        return { color: 'from-gray-600 to-gray-700', icon: ClipboardList };
      case 'participant':
        return { color: 'from-gray-600 to-gray-700', icon: Star };
      default:
        return { color: 'from-gray-500 to-gray-600', icon: Users };
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

  // Get connection purpose based on profile
  const getConnectionPurpose = () => {
    const purposes = [];
    if (sharedInterests.some(i => i.tag.includes('coffee') || i.tag.includes('food'))) {
      purposes.push('☕ Coffee chats');
    }
    if (sharedInterests.some(i => i.tag.includes('game') || i.tag.includes('gaming'))) {
      purposes.push('🎮 Gaming sessions');
    }
    if (sharedInterests.some(i => i.tag.includes('movie') || i.tag.includes('film'))) {
      purposes.push('🎬 Movie nights');
    }
    if (sharedInterests.some(i => i.type === 'in-person')) {
      purposes.push('🤝 In-person hangouts');
    }
    if (purposes.length === 0) {
      purposes.push('💬 Casual hangouts', '🎯 Shared activities');
    }
    return purposes.slice(0, 3);
  };

  const connectionPurposes = getConnectionPurpose();

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
              <div className="text-xs text-gray-600 dark:text-gray-400">new friend match</div>
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
              {React.createElement(archetypeStyle.icon, { className: "w-5 h-5" })}
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

        {/* Why We Matched Section */}
        <div className="mb-6 p-4 liquid-glass rounded-lg border border-accent-primary/20">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-accent-primary" />
            <h3 className="text-lg font-bold text-content-primary">Why You Match</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Friend Compatibility</span>
              <span className="font-bold text-accent-primary">{match.score}%</span>
            </div>
            {sharedInterests.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shared Interests</span>
                <span className="font-semibold text-content-primary">{sharedInterests.length} in common</span>
              </div>
            )}
            {match.profile.dna?.socialTempo === match.profile.dna?.socialTempo && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Social Preferences</span>
                <span className="font-semibold text-green-600 dark:text-green-400">✓ Compatible</span>
              </div>
            )}
            {match.profile.dna?.languages && match.profile.dna.languages.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Languages</span>
                <span className="font-semibold text-content-primary">{match.profile.dna.languages.join(', ').toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              💡 High compatibility for long-term friendship
            </p>
          </div>
        </div>

        {/* Connection Purpose Labels */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Perfect for
          </h3>
          <div className="flex flex-wrap gap-2">
            {connectionPurposes.map((purpose, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50"
              >
                {purpose}
              </span>
            ))}
          </div>
        </div>

        {/* Shared Interests */}
        {sharedInterests.length > 0 && (
          <div className="mb-6">
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
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white' 
                      : interest.passion === 'passionate'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }
                  `}
                >
                  {interest.tag.replace('#', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connection Preferences */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{getSocialTempoDisplay(match.profile.dna?.socialTempo || '')}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{getConnectionIntentDisplay(match.profile.dna?.connectionIntent || '')}</span>
          </div>
        </div>

        {/* Intent Badge */}
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 liquid-glass rounded-full border border-green-200/50 dark:border-green-700/50">
            <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              🎯 Serious about making friends
            </span>
          </div>
        </div>

        {/* Personalized Conversation Starters */}
        {icebreakers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              💬 Conversation Starters
            </h3>
            <div className="space-y-2">
              {icebreakers.map((icebreaker, idx) => {
                const Icon = icebreaker.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomMessage(icebreaker.text);
                      setShowDetails(true);
                    }}
                    className="w-full p-3 text-left text-sm flex items-center space-x-3 liquid-glass rounded-lg border border-gray-200/30 dark:border-gray-700/30 hover:border-accent-primary/50 transition-all hover:scale-[1.02]"
                  >
                    <Icon className="w-5 h-5 text-accent-primary flex-shrink-0" />
                    <span className="text-content-primary">{icebreaker.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Option */}
        {!showDetails && (
          <div className="mt-6">
            <button
              onClick={() => setShowDetails(true)}
              className="w-full p-4 text-sm font-medium text-content-primary hover:text-accent-primary transition-colors border-2 border-accent-primary/30 hover:border-accent-primary/60 rounded-lg liquid-glass flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Write a custom message</span>
            </button>
          </div>
        )}

        {showDetails && (
          <div className="mt-6 p-4 liquid-glass rounded-lg border-2 border-accent-primary/30">
            <h4 className="text-sm font-semibold text-content-primary mb-3">Your Message</h4>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={`Hey ${match.profile.displayName || match.profile.username}! I noticed we both love ${sharedInterests[0]?.tag.replace('#', '') || 'similar things'}...`}
              className="w-full p-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 liquid-glass text-content-primary resize-none placeholder-gray-500 dark:placeholder-gray-400 mb-3 focus:border-accent-primary/50 focus:outline-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setCustomMessage('');
                }}
                className="flex-1 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConnect(match.profile.uid!, customMessage)}
                disabled={isAnimating}
                className="flex-2 py-3 px-6 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2 border-2 border-gray-200/50 dark:border-gray-300/50"
              >
                <UserPlus className="w-5 h-5" />
                <span>Send Connection Request</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Action Controls - Prominent and Intentional */}
      <div className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onSkip}
            disabled={isAnimating}
            className="py-4 rounded-xl liquid-glass shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-red-300/50 dark:hover:border-red-700/50 flex flex-col items-center justify-center space-y-2 group"
          >
            <X className="w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400">
              Not Now
            </span>
          </button>

          <button
            onClick={() => !showDetails ? onConnect(match.profile.uid!) : null}
            disabled={isAnimating || showDetails}
            className="py-4 rounded-xl bg-white dark:bg-gray-100 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex flex-col items-center justify-center space-y-2 border-2 border-gray-200/50 dark:border-gray-300/50"
          >
            <UserPlus className="w-8 h-8 text-gray-900 dark:text-gray-800" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-800">
              Connect
            </span>
          </button>
        </div>
        
        <p className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
          Take your time - quality connections over quantity ✨
        </p>
      </div>
    </div>
  );
}
