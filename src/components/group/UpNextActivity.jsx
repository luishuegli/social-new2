'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function UpNextActivity({ group }) {
  if (!group?.nextActivity) {
    return null;
  }

  const activity = group.nextActivity;
  const activityDate = new Date(activity.date);
  const now = new Date();
  const timeDiff = activityDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'outing':
        return <MapPin className="w-5 h-5" />;
      case 'workshop':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'meeting':
        return 'text-accent-primary';
      case 'event':
        return 'text-support-success';
      case 'outing':
        return 'text-support-error';
      case 'workshop':
        return 'text-support-warning';
      default:
        return 'text-content-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    >
      <LiquidGlass className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content-primary">UP NEXT</h2>
          {daysDiff > 0 && (
            <div className="flex items-center space-x-2 text-content-secondary">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Starts in {daysDiff} day{daysDiff !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Activity Content */}
        <div className="space-y-4">
          {/* Activity Title and Icon */}
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full bg-background-primary ${getActivityTypeColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-content-primary line-clamp-2">
                {activity.title}
              </h3>
            </div>
          </div>

          {/* Activity Details */}
          <div className="space-y-2">
            {/* Date and Time */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-content-secondary" />
              <span className="text-content-secondary">
                {activityDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            {/* Location */}
            {activity.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-content-secondary" />
                <span className="text-content-secondary truncate">
                  {activity.location}
                </span>
              </div>
            )}

            {/* Participants (if available) */}
            {activity.participants && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-content-primary">
                    {activity.participants}
                  </span>
                </div>
                <span className="text-content-secondary">
                  {activity.participants} going
                </span>
              </div>
            )}
          </div>

          {/* View Details Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-accent-primary text-content-primary rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </LiquidGlass>
    </motion.div>
  );
} 