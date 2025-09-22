'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Heart,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';
import LiquidGlass from './LiquidGlass';
import { ModernButton, Badge, Text, Heading } from './DesignSystem';
import { useRSVP } from '../../app/hooks/useRSVP';

export default function ModernGroupCard({ 
  group, 
  onJoinActivity,
  onViewGroup,
  featured = false 
}) {
  const { handleRSVP, isLoading } = useRSVP();
  const [isLiked, setIsLiked] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      'Outdoor Adventures': 'from-green-500 to-emerald-600',
      'Culinary Experiences': 'from-orange-500 to-red-600',
      'Cultural Immersion': 'from-purple-500 to-pink-600',
      'Social Gatherings': 'from-blue-500 to-cyan-600',
      'Wellness & Mindfulness': 'from-teal-500 to-green-600',
      'Innovation & Learning': 'from-indigo-500 to-blue-600'
    };
    return gradients[category] || 'from-gray-500 to-slate-600';
  };

  const handleRSVPClick = async () => {
    if (!group.nextActivity) return;
    
    const result = await handleRSVP({
      activityId: group.nextActivity.id,
      groupId: group.id,
      action: group.nextActivity.joined ? 'leave' : 'join'
    });
    
    if (result && onJoinActivity) {
      onJoinActivity(group.id, group.nextActivity.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group cursor-pointer ${featured ? 'md:col-span-2' : ''}`}
      onClick={() => onViewGroup?.(group)}
    >
      <LiquidGlass className="overflow-hidden h-full">
        {/* Hero Section */}
        <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          {/* Background Gradient */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${
              group.nextActivity?.category 
                ? getCategoryGradient(group.nextActivity.category)
                : 'from-blue-500 to-purple-600'
            }`}
          />
          
          {/* Overlay Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/50" />
          
          {/* Group Image Overlay */}
          {group.coverImage && (
            <div className="absolute inset-0 bg-black/30">
              <Image
                src={group.coverImage}
                alt={group.name}
                fill
                className="object-cover opacity-70"
              />
            </div>
          )}

          {/* Top Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Category Badge */}
          {group.nextActivity?.emoji && (
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-white/90 text-gray-800 backdrop-blur-sm">
                <span className="mr-1">{group.nextActivity.emoji}</span>
                {group.nextActivity.category}
              </Badge>
            </div>
          )}

          {/* Member Avatars */}
          {group.members && group.members.length > 0 && (
            <div className="absolute bottom-4 left-4 flex -space-x-2">
              {group.members.slice(0, 4).map((member, index) => (
                <div
                  key={member.id || index}
                  className="w-8 h-8 rounded-full border-2 border-white bg-white/10 flex items-center justify-center overflow-hidden"
                  style={{ zIndex: 4 - index }}
                >
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              ))}
              {group.members.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    +{group.members.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Member Count */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs">
              <Users className="w-3 h-3" />
              <span>{group.memberCount} members</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Group Info */}
          <div>
            <Heading level={3} className="mb-2 group-hover:text-blue-300 transition-colors">
              {group.name}
            </Heading>
            <Text color="secondary" className="line-clamp-2">
              {group.description}
            </Text>
          </div>

          {/* Next Activity */}
          {group.nextActivity && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <Text size="sm" weight="semibold" color="accent">
                  Up Next
                </Text>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10">
                <h4 className="font-bold text-white mb-2 line-clamp-1">
                  {group.nextActivity.title}
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-sm text-white/80 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{formatDate(group.nextActivity.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="truncate">{group.nextActivity.location || 'TBA'}</span>
                  </div>
                </div>

                {/* RSVP Button */}
                <ModernButton
                  variant={group.nextActivity.joined ? "secondary" : "primary"}
                  size="sm"
                  loading={isLoading(group.nextActivity.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRSVPClick();
                  }}
                  icon={group.nextActivity.joined ? <Zap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  className="w-full"
                >
                  {group.nextActivity.joined ? 'Going!' : 'Join Activity'}
                </ModernButton>
              </div>
            </div>
          )}

          {/* Latest Activity */}
          {group.latestActivity && (
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {(typeof group.latestActivity.author === 'string' ? group.latestActivity.author.charAt(0)?.toUpperCase() : null) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Text size="sm" weight="semibold">
                      {typeof group.latestActivity.author === 'string' ? group.latestActivity.author : 'User'}
                    </Text>
                    <Text size="xs" color="muted">
                      {formatDate(group.latestActivity.timestamp)}
                    </Text>
                  </div>
                  <Text size="sm" color="secondary" className="line-clamp-2">
                    {group.latestActivity.content}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* View Group Button */}
          <div className="pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewGroup?.(group);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 text-white/70 hover:text-white transition-colors group/button"
            >
              <span className="text-sm font-medium">View Group</span>
              <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </LiquidGlass>
    </motion.div>
  );
}
