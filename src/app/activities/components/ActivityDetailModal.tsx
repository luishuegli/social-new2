'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, CheckCircle, HelpCircle, XCircle, Clock, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActivityDetailModalProps {
  activity: {
    id: string;
    title?: string;
    description?: string;
    date?: any;
    location?: string;
    groupId?: string;
    groupName?: string;
    participants?: string[];
    interested?: string[];
    left?: string[];
    participantProfiles?: any[];
    interestedProfiles?: any[];
    status?: string;
    creatorId?: string;
    type?: 'group' | 'solo';
  };
  onClose: () => void;
  userId: string;
  onActivityCreated?: () => void;
}

export default function ActivityDetailModal({ activity, onClose, userId, onActivityCreated }: ActivityDetailModalProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'going' | 'maybe' | 'not-going' | 'no-response'>(() => {
    if ((activity.participants || []).includes(userId)) {
      return 'going';
    } else if ((activity.interested || []).includes(userId)) {
      return 'maybe';
    } else if ((activity.left || []).includes(userId)) {
      return 'not-going';
    }
    return 'no-response';
  });

  const handleRSVP = async (action: 'join' | 'maybe' | 'leave') => {
    // Don't allow RSVP for solo activities
    if (activity.type === 'solo') {
      return;
    }

    if (!activity.groupId) {
      alert('Cannot update RSVP: Group ID missing');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.id,
          groupId: activity.groupId,
          userId: userId,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      // Update local status
      if (action === 'join') {
        setCurrentStatus('going');
      } else if (action === 'maybe') {
        setCurrentStatus('maybe');
      } else if (action === 'leave') {
        setCurrentStatus('not-going');
      }

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('Failed to update RSVP. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewGroup = () => {
    if (activity.groupId) {
      router.push(`/groups/${activity.groupId}`);
    }
  };

  // Handle date parsing
  let activityDate;
  if (activity.date) {
    if (activity.date.toDate && typeof activity.date.toDate === 'function') {
      activityDate = activity.date.toDate();
    } else {
      activityDate = new Date(activity.date);
    }
  } else {
    activityDate = new Date();
  }

  const isPast = activityDate < new Date();
  const isToday = activityDate.toDateString() === new Date().toDateString();
  const isSolo = activity.type === 'solo';

  const participantCount = activity.participantProfiles?.length || activity.participants?.length || 0;
  const interestedCount = activity.interestedProfiles?.length || activity.interested?.length || 0;

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
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-content-primary mb-1">{activity.title || 'Activity'}</h2>
              {!isSolo && activity.groupName && (
                <button
                  onClick={handleViewGroup}
                  className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
                >
                  {activity.groupName} →
                </button>
              )}
              {isSolo && (
                <span className="text-sm px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full">
                  Solo Activity
                </span>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date and Time */}
          <div className="mb-6 p-4 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-3 rounded-lg ${isPast ? 'bg-gray-500' : isToday ? 'bg-green-500' : 'bg-accent-primary'}`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold text-content-primary">
                  {activityDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-content-secondary flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{activityDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  {isPast && <span className="px-2 py-0.5 bg-gray-500/20 rounded-full text-xs font-medium">Past</span>}
                  {isToday && <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-xs font-medium">Today</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {activity.location && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent-primary mt-1" />
                <div>
                  <div className="text-sm font-semibold text-content-secondary mb-1">Location</div>
                  <div className="text-content-primary">{activity.location}</div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {activity.description && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-accent-primary mt-1" />
                <div>
                  <div className="text-sm font-semibold text-content-secondary mb-2">Description</div>
                  <p className="text-content-primary whitespace-pre-wrap">{activity.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance (only for group activities) */}
          {!isSolo && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-accent-primary mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-content-secondary mb-3">Attendance</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {participantCount}
                      </div>
                      <div className="text-sm text-content-secondary">Going</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {interestedCount}
                      </div>
                      <div className="text-sm text-content-secondary">Interested</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Status (only for group activities) */}
          {!isSolo && (
            <div className="mb-6 p-4 liquid-glass rounded-lg border-2 border-accent-primary/30">
              <div className="text-sm font-semibold text-content-secondary mb-2">Your Status</div>
              <div className="flex items-center space-x-2">
                {currentStatus === 'going' && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">You're Going!</span>
                  </>
                )}
                {currentStatus === 'maybe' && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">You're Interested</span>
                  </>
                )}
                {currentStatus === 'not-going' && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">You're Not Going</span>
                  </>
                )}
                {currentStatus === 'no-response' && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">No Response Yet</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (only for group activities and not past events) */}
        {!isSolo && !isPast && (
          <div className="sticky bottom-0 liquid-glass border-t border-gray-200/30 dark:border-gray-700/30 px-6 py-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleRSVP('join')}
                disabled={isUpdating || currentStatus === 'going'}
                className={`
                  py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
                  ${currentStatus === 'going'
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 hover:opacity-90 shadow-lg border-2 border-gray-200/50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Going</span>
              </button>

              <button
                onClick={() => handleRSVP('maybe')}
                disabled={isUpdating || currentStatus === 'maybe'}
                className={`
                  py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
                  ${currentStatus === 'maybe'
                    ? 'bg-yellow-500 text-white cursor-default'
                    : 'liquid-glass text-content-primary hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-gray-200/30 dark:border-gray-700/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <HelpCircle className="w-5 h-5" />
                <span>Maybe</span>
              </button>

              <button
                onClick={() => handleRSVP('leave')}
                disabled={isUpdating || currentStatus === 'not-going'}
                className={`
                  py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
                  ${currentStatus === 'not-going'
                    ? 'bg-red-500 text-white cursor-default'
                    : 'liquid-glass text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-red-200/30 dark:border-red-700/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <XCircle className="w-5 h-5" />
                <span>Not Going</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

