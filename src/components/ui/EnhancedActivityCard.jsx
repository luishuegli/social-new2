'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Zap, 
  TrendingUp, 
  Eye,
  Heart,
  MessageCircle,
  ArrowRight,
  Timer
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import { useAuth } from '@/app/contexts/AuthContext';

export default function EnhancedActivityCard({ 
  activity, 
  group, 
  isParticipant = false, 
  onJoin, 
  onLeave, 
  showFomo = true,
  size = 'large' // 'medium' | 'large' | 'xl'
}) {
  const { user } = useAuth?.() || { user: null };
  const [isHovered, setIsHovered] = useState(false);

  if (!activity) return null;

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

  const getSizeClasses = () => {
    switch (size) {
      case 'medium': return 'p-4';
      case 'large': return 'p-6';
      case 'xl': return 'p-8';
      default: return 'p-6';
    }
  };

  const getImageHeight = () => {
    switch (size) {
      case 'medium': return 'h-32';
      case 'large': return 'h-40';
      case 'xl': return 'h-48';
      default: return 'h-40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <LiquidGlass className={`overflow-hidden ${getSizeClasses()}`}>
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {isHappening && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </motion.div>
          )}
          
          {isUrgent && !isHappening && (
            <div className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Timer className="w-3 h-3" />
              SOON
            </div>
          )}

          {isAlmostFull && (
            <div className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
              {spotsLeft} LEFT
            </div>
          )}

          {isFull && (
            <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              FULL
            </div>
          )}
        </div>

        {/* Activity Image/Visual */}
        {activity.imageUrl ? (
          <div className={`relative ${getImageHeight()} rounded-lg overflow-hidden mb-4`}>
            <img
              src={activity.imageUrl}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${getActivityColor(activity.type)} opacity-20`} />
          </div>
        ) : (
          <div className={`relative ${getImageHeight()} rounded-lg overflow-hidden mb-4 bg-gradient-to-br ${getActivityColor(activity.type)} flex items-center justify-center`}>
            <div className="text-white opacity-80">
              {getActivityIcon(activity.type)}
            </div>
          </div>
        )}

        {/* Activity Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-content-primary line-clamp-2 ${size === 'xl' ? 'text-xl' : 'text-lg'}`}>
                {activity.title}
              </h3>
              {group && (
                <p className="text-sm text-content-secondary mt-1">
                  {group.name}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-full bg-gradient-to-br ${getActivityColor(activity.type)} text-white ml-3`}>
              {getActivityIcon(activity.type)}
            </div>
          </div>

          {activity.description && (
            <p className="text-sm text-content-secondary line-clamp-2 mb-3">
              {activity.description}
            </p>
          )}
        </div>

        {/* Activity Details */}
        <div className="space-y-3 mb-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-content-secondary" />
              <span className="text-sm text-content-secondary">
                {activityDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {isUpcoming && (
              <div className="flex items-center space-x-1 text-accent-primary">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{getTimeUntil()}</span>
              </div>
            )}
          </div>

          {/* Location */}
          {activity.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-content-secondary" />
              <span className="text-sm text-content-secondary truncate">
                {activity.location}
              </span>
            </div>
          )}

          {/* Cost */}
          {activity.cost !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-content-primary">
                {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
              </span>
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-content-secondary" />
              <span className="text-sm font-medium text-content-primary">
                {participants.length} going
              </span>
              {maxCapacity && (
                <span className="text-sm text-content-secondary">
                  / {maxCapacity}
                </span>
              )}
            </div>
            
            {showFomo && !isParticipant && participants.length > 0 && (
              <div className="flex items-center space-x-1 text-support-warning">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Popular</span>
              </div>
            )}
          </div>

          {/* Participant Avatars */}
          {participants.length > 0 && (
            <div className="flex -space-x-2 mb-2">
              {participants.slice(0, 6).map((participant, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white"
                >
                  {typeof participant === 'string' 
                    ? participant.slice(0, 2).toUpperCase()
                    : (participant.name || 'U').slice(0, 2).toUpperCase()
                  }
                </div>
              ))}
              {participants.length > 6 && (
                <div className="w-8 h-8 rounded-full bg-content-secondary border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white">
                  +{participants.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOMO Section for Non-Participants */}
        {showFomo && !isParticipant && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: isHovered ? 1 : 0.7, 
              height: 'auto' 
            }}
            className="mb-4 p-3 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-medium text-accent-primary">
                Don't miss out!
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>{participants.length} people are already going</span>
              {isAlmostFull && (
                <span className="text-support-warning font-medium">
                  Only {spotsLeft} spots left
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isParticipant ? (
            <div className="flex-1 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-support-success text-white rounded-lg font-semibold"
              >
                <span>You're Going!</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              {onLeave && (
                <button
                  onClick={onLeave}
                  className="w-full text-sm text-content-secondary hover:text-support-error transition-colors"
                >
                  Can't make it?
                </button>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onJoin}
              disabled={isFull}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                isFull 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isUrgent
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse'
                    : 'bg-accent-primary text-content-primary hover:bg-opacity-90'
              }`}
            >
              <span>
                {isFull ? 'Activity Full' : isUrgent ? 'Join Now!' : 'Join Activity'}
              </span>
              {!isFull && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          )}
        </div>

        {/* Social Proof */}
        {showFomo && participants.length > 5 && (
          <div className="mt-3 pt-3 border-t border-border-separator">
            <div className="flex items-center justify-center space-x-4 text-xs text-content-secondary">
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{participants.length * 3 + 12} interested</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{Math.floor(participants.length * 1.5)} comments</span>
              </div>
            </div>
          </div>
        )}
      </LiquidGlass>
    </motion.div>
  );
}