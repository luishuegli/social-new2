'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Clock, 
  MapPin, 
  Users, 
  Zap, 
  TrendingUp, 
  Eye, 
  Heart,
  Calendar,
  Star,
  Flame,
  ChevronRight,
  Activity
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';

const getActivityTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'karaoke':
    case 'music':
      return '🎤';
    case 'volunteer':
    case 'community':
      return '🤝';
    case 'trivia':
    case 'quiz':
      return '🧠';
    case 'picnic':
    case 'outdoor':
      return '🌳';
    case 'networking':
    case 'professional':
      return '💼';
    case 'sports':
    case 'fitness':
      return '⚽';
    default:
      return '✨';
  }
};

const getActivityGradient = (type) => {
  // Using approved design system colors only
  return 'from-accent-primary to-accent-secondary';
};

const getUrgencyBadge = (activity) => {
  const now = new Date();
  const startTime = new Date(activity.startTime || activity.date || Date.now());
  const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (activity.status === 'active') {
    return { text: 'LIVE NOW', color: 'bg-accent-primary', pulse: true, icon: <Zap className="w-3 h-3" /> };
  }
  
  if (diffHours < 1) {
    return { text: 'STARTING SOON', color: 'bg-accent-secondary', pulse: true, icon: <Clock className="w-3 h-3" /> };
  }
  
  if (diffHours < 24) {
    return { text: 'TODAY', color: 'bg-accent-muted', pulse: false, icon: <Calendar className="w-3 h-3" /> };
  }
  
  const participantCount = activity.participants?.length || 0;
  const maxParticipants = activity.maxParticipants || 20;
  
  if (participantCount / maxParticipants > 0.8) {
    return { text: `${maxParticipants - participantCount} SPOTS LEFT`, color: 'bg-accent-secondary', pulse: true, icon: <Flame className="w-3 h-3" /> };
  }
  
  if (participantCount > 10) {
    return { text: 'POPULAR', color: 'bg-accent-muted', pulse: false, icon: <TrendingUp className="w-3 h-3" /> };
  }
  
  return null;
};

const formatTimeUntil = (activity) => {
  const now = new Date();
  const startTime = new Date(activity.startTime || activity.date || Date.now());
  const diffMs = startTime.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Started';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
};

export default function FOMOActivityCard({ activity, onStartActivity, isActive, size = 'normal' }) {
  const [isHovered, setIsHovered] = useState(false);
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 50) + 20);
  const [interestedCount, setInterestedCount] = useState(Math.floor(Math.random() * 30) + 10);
  
  const urgencyBadge = getUrgencyBadge(activity);
  const timeUntil = formatTimeUntil(activity);
  const participantCount = activity.participantProfiles?.length || activity.participants?.length || 0;
  const activityIcon = getActivityTypeIcon(activity.type || activity.category);
  const gradient = getActivityGradient(activity.type || activity.category);
  
  // Simulate real-time updates for FOMO
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setViewCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
      if (Math.random() > 0.9) {
        setInterestedCount(prev => prev + 1);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const cardSize = size === 'large' ? 'p-6' : size === 'small' ? 'p-3' : 'p-4';
  const titleSize = size === 'large' ? 'text-xl' : size === 'small' ? 'text-base' : 'text-lg';
  const imageHeight = size === 'large' ? 'h-24' : size === 'small' ? 'h-16' : 'h-20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <LiquidGlass className={`${cardSize} overflow-hidden relative`}>
        {/* Subtle Background Overlay */}
        <div className="absolute inset-0 bg-background-secondary opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        
        {/* Urgency Badge */}
        {urgencyBadge && (
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              animate={urgencyBadge.pulse ? { scale: [1, 1.05, 1] } : {}}
              transition={urgencyBadge.pulse ? { duration: 2, repeat: Infinity } : {}}
              className={`${urgencyBadge.color} text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg`}
            >
              {urgencyBadge.icon}
              <span>{urgencyBadge.text}</span>
            </motion.div>
          </div>
        )}
        
        {/* Activity Type Icon */}
        <div className="absolute top-3 left-3 z-10">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-lg">
            {activityIcon}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center gap-4">
          {/* Activity Image/Thumbnail */}
          <div className={`relative ${imageHeight} w-20 rounded-xl overflow-hidden flex-shrink-0 bg-background-secondary`}>
            {activity.imageUrl ? (
              <Image 
                src={activity.imageUrl} 
                alt={activity.title} 
                fill 
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {activityIcon}
              </div>
            )}
            
            {/* Overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* Live indicator for active activities */}
            {activity.status === 'active' && (
              <div className="absolute bottom-1 left-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-accent-primary rounded-full"
                />
              </div>
            )}
          </div>

          {/* Activity Details */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`${titleSize} font-bold text-content-primary truncate mb-1`}>
              {activity.title}
            </h3>
            
            {/* Time and Location */}
            <div className="flex items-center space-x-3 text-sm text-content-secondary mb-2">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{timeUntil}</span>
              </div>
              
              {activity.location && (
                <div className="flex items-center space-x-1 truncate">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{activity.location}</span>
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {activity.participantProfiles?.slice(0, 4).map((participant, idx) => (
                  <motion.div
                    key={participant.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/20 bg-background-secondary"
                    style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
                  >
                    {participant.avatarUrl ? (
                      <img 
                        src={participant.avatarUrl} 
                        alt={participant.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-content-primary bg-accent-muted">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {participantCount > 4 && (
                  <div className="w-7 h-7 rounded-full bg-accent-primary/20 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-accent-primary" style={{ marginLeft: '-8px' }}>
                    +{participantCount - 4}
                  </div>
                )}
                
                <div className="flex items-center space-x-1 text-sm text-content-secondary ml-2">
                  <Users className="w-4 h-4" />
                  <span>{participantCount} going</span>
                </div>
              </div>
            </div>

            {/* FOMO Metrics */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-content-secondary">
              <motion.div 
                className="flex items-center space-x-1"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              >
                <Eye className="w-3 h-3" />
                <span>{viewCount} viewing</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center space-x-1"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              >
                <Heart className="w-3 h-3" />
                <span>{interestedCount} interested</span>
              </motion.div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {isActive ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-4 py-2 bg-accent-primary text-content-primary rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg"
              >
                <Activity className="w-4 h-4" />
                <span>Active</span>
              </motion.div>
            ) : (
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStartActivity?.(activity.id);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-content-primary rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                <span>Start Activity</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Hover Effect Glow */}
        <motion.div
          className="absolute inset-0 bg-accent-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-2xl"
          animate={isHovered ? { opacity: 0.1 } : { opacity: 0 }}
        />
      </LiquidGlass>
      
      {/* Floating Action Indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 bg-accent-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        animate={isHovered ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
}
