'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityCardProps {
  activity: {
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
  };
  onJoin?: (activityId: string) => void;
  onViewDetails?: (activityId: string) => void;
}

export default function ActivityCard({ activity, onJoin, onViewDetails }: ActivityCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJoining || hasJoined) return;

    setIsJoining(true);
    try {
      if (onJoin) {
        await onJoin(activity.id);
        setHasJoined(true);
      }
    } catch (error) {
      console.error('Failed to join activity:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(activity.id);
    }
  };

  // Format the date
  const activityDate = activity.date instanceof Date 
    ? activity.date 
    : new Date(activity.date);
  const formattedDate = format(activityDate, 'MMM d, yyyy');
  const formattedTime = format(activityDate, 'h:mm a');

  // Check if activity is full
  const isFull = activity.maxAttendees && activity.attendeeCount 
    ? activity.attendeeCount >= activity.maxAttendees 
    : false;

  return (
    <div
      onClick={handleCardClick}
      className="liquid-glass rounded-xl p-6 border border-gray-200/20 dark:border-gray-700/20 hover:border-accent-primary/50 transition-all cursor-pointer hover:scale-[1.02] group"
    >
      {/* Activity Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-accent-primary transition-colors">
          {activity.name}
        </h3>
        {activity.groupName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{activity.groupName}</span>
          </p>
        )}
      </div>

      {/* Activity Description */}
      {activity.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Activity Details */}
      <div className="space-y-2 mb-4">
        {/* Date and Time */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formattedDate}</span>
          <Clock className="w-4 h-4 flex-shrink-0 ml-2" />
          <span>{formattedTime}</span>
        </div>

        {/* Location */}
        {activity.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        )}

        {/* Attendee Count */}
        {activity.attendeeCount !== undefined && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>
              {activity.attendeeCount} {activity.maxAttendees ? `/ ${activity.maxAttendees}` : ''} attending
            </span>
            {isFull && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                Full
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attendee Avatars */}
      {activity.attendees && activity.attendees.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex -space-x-2">
            {activity.attendees.slice(0, 5).map((attendee, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400"
              >
                {attendee.photoURL ? (
                  <img
                    src={attendee.photoURL}
                    alt={attendee.displayName || 'Attendee'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {(attendee.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {activity.attendees.length > 5 && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              +{activity.attendees.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleJoin}
        disabled={isJoining || hasJoined || isFull}
        className={`
          w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
          ${hasJoined
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
            : isFull
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 hover:opacity-90 shadow-lg border-2 border-gray-200/50 dark:border-gray-300/50'
          }
          ${isJoining ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {hasJoined ? (
          <>
            <Check className="w-5 h-5" />
            <span>Joined!</span>
          </>
        ) : isFull ? (
          <span>Activity Full</span>
        ) : isJoining ? (
          <span>Joining...</span>
        ) : (
          <span>Join Activity</span>
        )}
      </button>
    </div>
  );
}

