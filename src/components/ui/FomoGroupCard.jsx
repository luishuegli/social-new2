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
  Timer,
  Flame,
  Target
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import GroupCardRSVP from './GroupCardRSVP';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

export default function FomoGroupCard({ group, size = 'large' }) {
  const { user } = useAuth?.() || { user: null };
  const [isHovered, setIsHovered] = useState(false);

  if (!group) return null;

  const activity = group.nextActivity;
  const members = group.members || [];
  const displayMembers = members.slice(0, 8);
  const remainingCount = members.length - displayMembers.length;

  // Activity timing calculations
  let activityDate, timeDiff, daysDiff, hoursDiff, isUpcoming, isUrgent, isHappening;
  
  if (activity?.date) {
    activityDate = new Date(activity.date);
    const now = new Date();
    timeDiff = activityDate.getTime() - now.getTime();
    daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
    isUpcoming = timeDiff > 0;
    isUrgent = hoursDiff <= 24 && hoursDiff > 0;
    isHappening = Math.abs(timeDiff) < 2 * 3600 * 1000;
  }

  const participants = activity?.participants || [];
  const isUserParticipant = user?.uid && participants.includes(user.uid);
  const activityPopularity = participants.length;
  const isPopular = activityPopularity >= 5;
  const isTrending = activityPopularity >= 8;

  const getTimeUntil = () => {
    if (!isUpcoming || !activity?.date) return '';
    if (daysDiff > 1) return `${daysDiff} days`;
    if (hoursDiff > 1) return `${hoursDiff}h`;
    return 'Starting soon!';
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

  return (
    <Link href={`/groups/${group.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6, scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative h-full"
      >
        <LiquidGlass className={`overflow-hidden h-full flex flex-col ${getSizeClasses()}`}>
          {/* Status Badges */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {isHappening && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE NOW
              </motion.div>
            )}
            
            {isUrgent && !isHappening && (
              <div className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {getTimeUntil()}
              </div>
            )}

            {isTrending && (
              <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3" />
                TRENDING
              </div>
            )}

            {isPopular && !isTrending && (
              <div className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                POPULAR
              </div>
            )}
          </div>

          {/* Group Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-content-primary line-clamp-1 ${size === 'xl' ? 'text-xl' : 'text-lg'}`}>
                  {group.name}
                </h3>
                <p className="text-sm text-content-secondary mt-1">
                  {group.category} • {members.length} members
                </p>
              </div>
              
              {group.imageUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden ml-3 flex-shrink-0">
                  <img
                    src={group.imageUrl}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {group.description && (
              <p className="text-sm text-content-secondary line-clamp-2 mb-3">
                {group.description}
              </p>
            )}
          </div>

          {/* Upcoming Activity - Main Focus */}
          {activity && (
            <div className="mb-4 flex-grow">
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getActivityColor(activity.type)} text-white`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-accent-primary">NEXT UP</span>
                      {isUpcoming && (
                        <div className="flex items-center space-x-1 text-support-warning">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">{getTimeUntil()}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-content-primary line-clamp-1 text-lg">
                      {activity.title}
                    </h4>
                  </div>
                </div>

                {activity.description && (
                  <p className="text-sm text-content-secondary line-clamp-2 mb-3 ml-12">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Activity Details */}
              <div className="space-y-2 ml-12">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-content-secondary" />
                  <span className="text-sm text-content-secondary">
                    {activityDate?.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {activity.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-content-secondary" />
                    <span className="text-sm text-content-secondary truncate">
                      {activity.location}
                    </span>
                  </div>
                )}

                {activity.cost !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-content-secondary" />
                    <span className="text-sm font-medium text-content-primary">
                      {activity.cost === 0 ? 'Free Event' : `$${activity.cost}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Participants & FOMO */}
              <div className="mt-4 ml-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-content-secondary" />
                    <span className="text-sm font-medium text-content-primary">
                      {participants.length} going
                    </span>
                  </div>
                  
                  {!isUserParticipant && participants.length > 0 && (
                    <div className="flex items-center space-x-1 text-support-warning">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">Join them!</span>
                    </div>
                  )}
                </div>

                {/* Participant Avatars */}
                {participants.length > 0 && (
                  <div className="flex -space-x-2 mb-2">
                    {participants.slice(0, 5).map((participant, idx) => (
                      <div
                        key={idx}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white"
                      >
                        {typeof participant === 'string' 
                          ? participant.slice(0, 2).toUpperCase()
                          : (participant.name || 'U').slice(0, 2).toUpperCase()
                        }
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-content-secondary border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white">
                        +{participants.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* FOMO Message */}
                {!isUserParticipant && participants.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0.8 }}
                    className="p-2 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20 mt-2"
                  >
                    <p className="text-xs text-accent-primary font-medium">
                      {participants.length} people are going • Don't miss out!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Group Members Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-content-secondary">
                Group Members
              </span>
              <span className="text-sm text-content-secondary">
                {members.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-2">
                {displayMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white"
                  >
                    {typeof member === 'string' 
                      ? member.slice(0, 2).toUpperCase()
                      : (member.name || member.username || 'M').slice(0, 2).toUpperCase()
                    }
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-6 h-6 rounded-full bg-content-secondary border-2 border-background-primary flex items-center justify-center text-xs font-semibold text-white">
                    +{remainingCount}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="mt-auto">
            {activity && (
              <div className="mb-3">
                <GroupCardRSVP group={group} />
              </div>
            )}
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-accent-primary text-content-primary rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200"
            >
              <span>View Group</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Social Proof Footer */}
          {activity && participants.length > 3 && (
            <div className="mt-3 pt-3 border-t border-border-separator">
              <div className="flex items-center justify-center space-x-4 text-xs text-content-secondary">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{participants.length * 2 + 8} interested</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{Math.floor(participants.length * 1.2)} talking</span>
                </div>
              </div>
            </div>
          )}
        </LiquidGlass>
      </motion.div>
    </Link>
  );
}





