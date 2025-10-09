'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp, 
  Eye,
  Heart,
  MessageCircle,
  ArrowRight,
  Timer,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import { useAuth } from '@/app/contexts/AuthContext';

export default function EnhancedActivityCard({ 
  activity, 
  onStartActivity,
  isActive = false,
  size = 'large',
  onActivityUpdate // New prop to handle activity updates
}) {
  const { user } = useAuth?.() || { user: null };
  const [rsvpStatus, setRsvpStatus] = useState('none'); // 'going', 'maybe', 'left', 'none'
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localActivity, setLocalActivity] = useState(activity);

  // Update local activity when prop changes
  useEffect(() => {
    setLocalActivity(activity);
  }, [activity]);

  // Determine current RSVP status
  useEffect(() => {
    if (!user?.uid || !localActivity) return;
    
    const participants = localActivity.participants || [];
    const interested = localActivity.interested || [];
    const left = localActivity.left || [];
    
    if (participants.includes(user.uid)) {
      setRsvpStatus('going');
    } else if (interested.includes(user.uid)) {
      setRsvpStatus('maybe');
    } else if (left.includes(user.uid)) {
      setRsvpStatus('left');
    } else {
      setRsvpStatus('none');
    }
  }, [user?.uid, localActivity]);

  const handleRSVP = async (action) => {
    if (!user?.uid || !localActivity || rsvpLoading) return;
    
    setRsvpLoading(true);
    try {
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: localActivity.id,
          groupId: localActivity.groupId,
          userId: user.uid,
          action: action
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('RSVP successful:', result);
        
        // Update local activity state immediately for better UX
        const updatedActivity = {
          ...localActivity,
          participants: result.participants || localActivity.participants || [],
          interested: result.interested || localActivity.interested || [],
          left: result.left || localActivity.left || []
        };
        
        setLocalActivity(updatedActivity);
        
        // Notify parent component to refresh the activity list
        if (onActivityUpdate) {
          onActivityUpdate(updatedActivity);
        }
        
        // Update RSVP status
        if (action === 'join') {
          setRsvpStatus('going');
        } else if (action === 'maybe') {
          setRsvpStatus('maybe');
        } else if (action === 'leave') {
          setRsvpStatus('left');
        }
      } else {
        const errorData = await response.json();
        console.error('RSVP failed:', errorData);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('RSVP error:', error);
      // Could show a toast notification here
    } finally {
      setRsvpLoading(false);
    }
  };

  const activityDate = localActivity.date ? new Date(localActivity.date) : new Date();
  const now = new Date();
  const timeDiff = activityDate.getTime() - now.getTime();
  const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
  const isUpcoming = timeDiff > 0;
  const isHappening = Math.abs(timeDiff) < 2 * 3600 * 1000;
  const isUrgent = hoursDiff <= 24 && hoursDiff > 0;

  const participants = localActivity.participants || [];
  const interested = localActivity.interested || [];
  const left = localActivity.left || [];
  const participantCount = participants.length;
  const interestedCount = interested.length;
  const leftCount = left.length;

  const getTimeUntil = () => {
    if (!isUpcoming) return 'Started';
    if (hoursDiff > 24) return `${Math.ceil(hoursDiff / 24)}d`;
    if (hoursDiff > 1) return `${hoursDiff}h`;
    return `${Math.ceil(timeDiff / (1000 * 60))}m`;
  };

  return (
    <div className="relative group">
      <LiquidGlass className="p-6 overflow-hidden">
        {/* Status Badges */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {localActivity.status === 'active' && (
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.7)",
                  "0 0 0 4px rgba(34, 197, 94, 0.3)",
                  "0 0 0 0 rgba(34, 197, 94, 0.7)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-accent-primary text-white text-xs font-bold rounded-full flex items-center gap-1 border-2 border-green-500"
            >
              LIVE
            </motion.div>
          )}
          
          {isUrgent && !isHappening && localActivity.status !== 'active' && (
            <div className="px-3 py-1 bg-accent-secondary text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Timer className="w-3 h-3" />
              SOON
            </div>
          )}
        </div>

        {/* Activity Image */}
        {localActivity.imageUrl ? (
          <div className="relative h-40 rounded-lg overflow-hidden mb-4 cursor-pointer" onClick={() => setShowDetails(true)}>
            <img
              src={localActivity.imageUrl}
              alt={localActivity.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              Click for details
            </div>
          </div>
        ) : (
          <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <div className="text-white opacity-80">
              <Zap className="w-12 h-12" />
            </div>
          </div>
        )}

        {/* Activity Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-content-primary mb-2 line-clamp-2">
            {localActivity.title}
          </h3>
          <div className="flex items-center space-x-2 text-content-secondary mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{localActivity.groupName}</span>
          </div>
          
          {localActivity.description && (
            <p className="text-sm text-content-secondary line-clamp-2">
              {localActivity.description}
            </p>
          )}
        </div>

        {/* Activity Details */}
        <div className="space-y-2 mb-4">
          {localActivity.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-content-secondary" />
              <span className="text-sm text-content-secondary">{localActivity.location}</span>
            </div>
          )}
          
          {isUpcoming && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-content-secondary" />
              <span className="text-sm text-content-secondary">{getTimeUntil()}</span>
            </div>
          )}
        </div>

        {/* Participant Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-content-secondary" />
              <span className="text-sm font-medium text-content-primary">
                {participantCount} going
              </span>
              {interestedCount > 0 && (
                <span className="text-sm text-content-secondary">
                  • {interestedCount} maybe
                </span>
              )}
              {leftCount > 0 && (
                <span className="text-sm text-content-secondary">
                  • {leftCount} left
                </span>
              )}
            </div>
          </div>

          {/* Going Participants */}
          {participantCount > 0 && (
            <div className="mb-2">
              <div className="flex items-center space-x-2 mb-1">
                <UserCheck className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Going ({participantCount})</span>
              </div>
              <div className="flex -space-x-1 ml-5">
                {localActivity.participantProfiles?.slice(0, 8).map((participant, idx) => (
                  <div
                    key={participant.id || idx}
                    className="w-6 h-6 rounded-full border-2 border-green-500 overflow-hidden bg-accent-muted"
                  >
                    {participant.avatarUrl ? (
                      <img 
                        src={participant.avatarUrl} 
                        alt={participant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ))}
                {participantCount > 8 && (
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs font-semibold text-white">
                    +{participantCount - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maybe Participants */}
          {interestedCount > 0 && (
            <div className="mb-2">
              <div className="flex items-center space-x-2 mb-1">
                <UserMinus className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-500 font-medium">Maybe ({interestedCount})</span>
              </div>
              <div className="flex -space-x-1 ml-5">
                {localActivity.interestedProfiles?.slice(0, 8).map((participant, idx) => (
                  <div
                    key={participant.id || idx}
                    className="w-6 h-6 rounded-full border-2 border-yellow-500 overflow-hidden bg-accent-muted"
                  >
                    {participant.avatarUrl ? (
                      <img 
                        src={participant.avatarUrl} 
                        alt={participant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ))}
                {interestedCount > 8 && (
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-xs font-semibold text-white">
                    +{interestedCount - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Participants */}
          {leftCount > 0 && (
            <div className="mb-2">
              <div className="flex items-center space-x-2 mb-1">
                <UserX className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-500 font-medium">Left ({leftCount})</span>
              </div>
              <div className="flex -space-x-1 ml-5">
                {localActivity.leftProfiles?.slice(0, 8).map((participant, idx) => (
                  <div
                    key={participant.id || idx}
                    className="w-6 h-6 rounded-full border-2 border-red-500 overflow-hidden bg-accent-muted opacity-50"
                  >
                    {participant.avatarUrl ? (
                      <img 
                        src={participant.avatarUrl} 
                        alt={participant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ))}
                {leftCount > 8 && (
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-xs font-semibold text-white opacity-50">
                    +{leftCount - 8}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RSVP Actions */}
        <div className="flex space-x-2 mb-4">
          {rsvpStatus === 'going' ? (
            <button
              onClick={() => handleRSVP('leave')}
              disabled={rsvpLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-support-success text-white rounded-lg text-sm font-semibold"
            >
              <UserCheck className="w-4 h-4" />
              <span>Going</span>
            </button>
          ) : (
            <button
              onClick={() => handleRSVP('join')}
              disabled={rsvpLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-accent-primary hover:bg-accent-secondary text-content-primary rounded-lg text-sm font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join</span>
            </button>
          )}
          
          {rsvpStatus === 'maybe' ? (
            <button
              onClick={() => handleRSVP('leave')}
              disabled={rsvpLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-accent-secondary text-white rounded-lg text-sm font-semibold"
            >
              <UserX className="w-4 h-4" />
              <span>Maybe</span>
            </button>
          ) : (
            <button
              onClick={() => handleRSVP('maybe')}
              disabled={rsvpLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-accent-muted hover:bg-accent-secondary text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              <span>Maybe</span>
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex space-x-2">
          {isActive ? (
            <div className="flex-1 px-4 py-3 bg-support-success text-white rounded-lg font-semibold text-center flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Active</span>
            </div>
          ) : (
            <button
              onClick={() => onStartActivity?.(localActivity.id)}
              className="flex-1 px-4 py-3 bg-accent-primary hover:bg-accent-secondary text-content-primary rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Start Activity</span>
            </button>
          )}
          
          <button
            onClick={() => setShowDetails(true)}
            className="px-4 py-3 bg-content-secondary hover:bg-content-primary text-white rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}