'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, Users, Timer, TrendingUp, Eye, Heart, Zap, Star } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function UpNextActivity({ group, size = 'large', showFomo = true }) {
  if (!group?.nextActivity) {
    return null;
  }

  const activity = group.nextActivity;
  const activityDate = new Date(activity.date);
  const now = new Date();
  const timeDiff = activityDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
  const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
  
  const isUpcoming = timeDiff > 0;
  const isHappening = Math.abs(timeDiff) < 2 * 3600 * 1000; // Within 2 hours
  const isUrgent = hoursDiff <= 24 && hoursDiff > 0;
  
  const participants = activity.participants || [];
  const maxCapacity = activity.maxCapacity || 20;
  const spotsLeft = maxCapacity - participants.length;
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  const getTimeUntil = () => {
    if (!isUpcoming) return 'Started';
    if (daysDiff > 1) return `${daysDiff} days`;
    if (hoursDiff > 1) return `${hoursDiff}h`;
    if (minutesDiff > 1) return `${minutesDiff}m`;
    return 'Starting now!';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting': return <Users className="w-5 h-5" />;
      case 'event': return <Star className="w-5 h-5" />;
      case 'outing': return <MapPin className="w-5 h-5" />;
      case 'workshop': return <Zap className="w-5 h-5" />;
      case 'social': return <Heart className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'meeting': return 'from-blue-500 to-indigo-600';
      case 'event': return 'from-purple-500 to-pink-600';
      case 'outing': return 'from-green-500 to-emerald-600';
      case 'workshop': return 'from-orange-500 to-red-600';
      case 'social': return 'from-pink-500 to-rose-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    >
      <LiquidGlass className={size === 'xl' ? 'p-8' : 'p-6'}>
        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isHappening && (
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
          
          {isUrgent && !isHappening && (
            <div className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {getTimeUntil()}
            </div>
          )}

          {isAlmostFull && (
            <div className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
              {spotsLeft} SPOTS LEFT
            </div>
          )}

          {participants.length >= 8 && (
            <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              POPULAR
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`font-bold text-content-primary ${size === 'xl' ? 'text-2xl' : 'text-xl'}`}>
              UP NEXT
            </h2>
            {isUpcoming && (
              <div className="flex items-center space-x-2 text-accent-primary mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{getTimeUntil()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity Content */}
        <div className="space-y-6">
          {/* Activity Title and Icon */}
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getActivityColor(activity.type)} text-white`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-content-primary line-clamp-2 ${size === 'xl' ? 'text-2xl' : 'text-xl'}`}>
                {activity.title}
              </h3>
              {activity.description && (
                <p className="text-content-secondary mt-2 line-clamp-2">
                  {activity.description}
                </p>
              )}
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

            {/* Cost */}
            {activity.cost !== undefined && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-content-primary">
                  {activity.cost === 0 ? 'Free Event' : `$${activity.cost}`}
                </span>
              </div>
            )}
          </div>

          {/* Participants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-content-secondary" />
                <span className="font-medium text-content-primary">
                  {participants.length} going
                </span>
                {maxCapacity && (
                  <span className="text-content-secondary">
                    / {maxCapacity}
                  </span>
                )}
              </div>
              
              {participants.length >= 5 && (
                <div className="flex items-center space-x-1 text-support-warning">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Popular</span>
                </div>
              )}
            </div>

            {/* Participant Avatars */}
            {participants.length > 0 && (
              <div className="flex -space-x-2">
                {participants.slice(0, 8).map((participant, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary border-2 border-background-primary flex items-center justify-center text-sm font-semibold text-white"
                  >
                    {typeof participant === 'string' 
                      ? participant.slice(0, 2).toUpperCase()
                      : (participant.name || 'U').slice(0, 2).toUpperCase()
                    }
                  </div>
                ))}
                {participants.length > 8 && (
                  <div className="w-10 h-10 rounded-full bg-content-secondary border-2 border-background-primary flex items-center justify-center text-sm font-semibold text-white">
                    +{participants.length - 8}
                  </div>
                )}
              </div>
            )}

            {/* FOMO Message */}
            {showFomo && participants.length > 3 && (
              <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-accent-primary" />
                  <span className="text-sm font-medium text-accent-primary">
                    Don't miss out!
                  </span>
                </div>
                <p className="text-sm text-content-secondary">
                  {participants.length} people are already going to this activity.
                  {isAlmostFull && ` Only ${spotsLeft} spots remaining!`}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full mt-6 flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-semibold transition-all duration-200 ${
              isUrgent
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse'
                : 'bg-accent-primary text-content-primary hover:bg-opacity-90'
            }`}
          >
            <span>
              {isUrgent ? 'Join Now - Starting Soon!' : 'View Activity Details'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Social Proof */}
          {participants.length > 5 && (
            <div className="mt-4 pt-4 border-t border-border-separator">
              <div className="flex items-center justify-center space-x-6 text-sm text-content-secondary">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{participants.length * 3 + 15} interested</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{participants.length * 2 + 8} viewing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </LiquidGlass>
    </motion.div>
  );
} 