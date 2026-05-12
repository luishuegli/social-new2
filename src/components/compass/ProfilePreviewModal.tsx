'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/app/types/firestoreSchema';
import { 
  X, 
  UserPlus, 
  MessageCircle, 
  MapPin, 
  Sparkles,
  Users,
  Calendar,
  Palette,
  Compass,
  ClipboardList,
  Star
} from 'lucide-react';

interface ProfilePreviewModalProps {
  user: Partial<UserProfile>;
  matchScore?: number;
  sharedInterests?: any[];
  onClose: () => void;
  onConnect: (userId: string, message?: string) => void;
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({ 
  user, 
  matchScore,
  sharedInterests = [],
  onClose, 
  onConnect 
}) => {
  const [message, setMessage] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async () => {
    if (!user.uid) return;
    
    setIsSubmitting(true);
    try {
      await onConnect(user.uid, isMessaging ? message : undefined);
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsSubmitting(false);
    }
  };

  // Get archetype styling
  const getArchetypeStyle = (archetype?: string) => {
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
  const getSocialTempoDisplay = (tempo?: string) => {
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
  const getConnectionIntentDisplay = (intent?: string) => {
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

  const archetypeStyle = getArchetypeStyle(user.dna?.archetype);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="liquid-glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200/20 dark:border-gray-700/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 liquid-glass border-b border-gray-200/30 dark:border-gray-700/30 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-content-primary">Profile Preview</h2>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Header with Avatar and Match Score */}
          <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-6 overflow-hidden">
            {/* Match Score Badge */}
            {matchScore && (
              <div className="absolute top-4 right-4 z-10">
                <div className="liquid-glass rounded-full px-4 py-2 border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-accent-primary" />
                    <span className="font-bold text-lg text-content-primary">{matchScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Archetype Badge */}
            {user.dna?.archetype && (
              <div className="absolute top-4 left-4 z-10">
                <div className={`bg-gradient-to-r ${archetypeStyle.color} text-white rounded-full px-4 py-2 shadow-lg border border-white/20`}>
                  <div className="flex items-center space-x-2">
                    {React.createElement(archetypeStyle.icon, { className: "w-5 h-5" })}
                    <span className="font-semibold capitalize">{user.dna.archetype}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || user.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/80 dark:border-gray-700/80 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl border-4 border-white/80 dark:border-gray-700/80">
                  <span className="text-5xl text-white font-bold">
                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name and Username */}
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-content-primary mb-2">
              {user.displayName || user.username}
            </h3>
            {user.displayName && user.username && (
              <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <p className="text-gray-700 dark:text-gray-300 text-center">{user.bio}</p>
            </div>
          )}

          {/* Match Details */}
          {matchScore && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border border-accent-primary/20">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-accent-primary" />
                <h4 className="text-lg font-bold text-content-primary">Why You Match</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Friend Compatibility</span>
                  <span className="font-bold text-accent-primary">{matchScore}%</span>
                </div>
                {sharedInterests.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shared Interests</span>
                    <span className="font-semibold text-content-primary">{sharedInterests.length} in common</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared Interests */}
          {sharedInterests.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Shared Interests ({sharedInterests.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {sharedInterests.map((interest: any) => (
                  <span 
                    key={interest.tag}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium
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
          {user.dna && (
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{getSocialTempoDisplay(user.dna.socialTempo)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{getConnectionIntentDisplay(user.dna.connectionIntent)}</span>
              </div>
            </div>
          )}

          {/* Languages */}
          {user.dna?.languages && user.dna.languages.length > 0 && (
            <div className="mb-6 p-3 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Languages</span>
                <span className="text-sm font-semibold text-content-primary">
                  {user.dna.languages.join(', ').toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Message Section */}
          {isMessaging ? (
            <div className="mb-6 p-4 liquid-glass rounded-lg border-2 border-accent-primary/30">
              <h4 className="text-sm font-semibold text-content-primary mb-3 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Your Message (Optional)</span>
              </h4>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hey ${user.displayName || user.username}! I'd love to connect...`}
                className="w-full p-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 liquid-glass text-content-primary resize-none placeholder-gray-500 dark:placeholder-gray-400 mb-3 focus:border-accent-primary/50 focus:outline-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {message.length}/500 characters
              </p>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 liquid-glass border-t border-gray-200/30 dark:border-gray-700/30 px-6 py-4">
          <div className="flex flex-col space-y-3">
            {!isMessaging ? (
              <>
                <button
                  onClick={handleConnect}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2 border-2 border-gray-200/50 dark:border-gray-300/50"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isSubmitting ? 'Connecting...' : 'Connect Now'}</span>
                </button>
                <button
                  onClick={() => setIsMessaging(true)}
                  className="w-full py-3 text-content-primary rounded-lg font-medium border-2 border-accent-primary/30 hover:border-accent-primary/60 liquid-glass transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Add a Personal Message</span>
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsMessaging(false);
                    setMessage('');
                  }}
                  className="flex-1 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2 border-2 border-gray-200/50 dark:border-gray-300/50"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Connection Request'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;

