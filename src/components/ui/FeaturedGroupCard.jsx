'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Star, ArrowRight } from 'lucide-react';
import MembersModal from './MembersModal';
import LiquidGlass from './LiquidGlass';

// MemberAvatar component with error handling
function MemberAvatar({ member, index, totalMembers, size = "small" }) {
  const [imageError, setImageError] = React.useState(false);
  const isLarge = size === "large";
  const sizeClasses = isLarge ? "w-10 h-10" : "w-8 h-8";
  const imageSize = isLarge ? 40 : 24;
  const textSize = isLarge ? "text-sm" : "text-xs";

  return (
    <div
      className={`${sizeClasses} rounded-full border-2 border-background-primary overflow-hidden bg-background-secondary flex items-center justify-center`}
      style={{ zIndex: totalMembers - index }}
    >
      {member.avatarUrl && !imageError ? (
        <Image
          src={member.avatarUrl}
          alt={member.name}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`${textSize} font-semibold text-content-primary`}>
          {member.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

export default function FeaturedGroupCard({ group }) {
  const [isMembersOpen, setIsMembersOpen] = React.useState(false);
  // Display more members for the featured card
  const displayMembers = group.members?.slice(0, 6) || [];
  const remainingCount = (group.members?.length || 0) - displayMembers.length;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'outing':
        return <MapPin className="w-5 h-5" />;
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
      default:
        return 'text-content-secondary';
    }
  };

  return (
    <Link href={`/groups/${group.id}`} className="block col-span-1 md:col-span-2 lg:col-span-3">
      <motion.div
        layoutId={`group-card-container-${group.id}`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="w-full"
      >
        <LiquidGlass className="p-6 w-full">
          {/* Featured Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-accent-primary fill-current" />
              <span className="text-sm font-semibold text-accent-primary">Featured Group</span>
            </div>
            {group.nextActivity && (
              <div className="px-3 py-1 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/10">
                <span className="text-xs font-semibold">Next Activity Soon</span>
              </div>
            )}
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Section - Group Info */}
            <div className="flex-1 min-w-0">
              {/* Group Header */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-content-primary mb-2">
                  {group.name}
                </h2>
                <p className="text-content-secondary leading-relaxed line-clamp-3">
                  {group.description}
                </p>
              </div>

              {/* Category Badge */}
              {group.category && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1.5 bg-background-secondary rounded-full text-sm font-medium text-content-secondary">
                    {group.category}
                  </span>
                </div>
              )}

              {/* Members Section - Moved Below Group Name */}
              <div className="flex items-center space-x-4">
                {/* Stacked Member Avatars */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); } }}
                  className="flex -space-x-3 focus:outline-none"
                  aria-label="View members"
                >
                  {displayMembers.map((member, index) => (
                    <MemberAvatar
                      key={member.id}
                      member={member}
                      index={index}
                      totalMembers={displayMembers.length}
                      size="large"
                    />
                  ))}
                  {remainingCount > 0 && (
                    <div className="w-10 h-10 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                      <span className="text-sm font-semibold text-content-primary">
                        +{remainingCount}
                      </span>
                    </div>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-content-secondary"
                  aria-label="View members"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {group.memberCount || group.members?.length || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Section - Activity Info */}
            {group.nextActivity && (
              <div className="md:w-80 flex-shrink-0">
                <div className="p-4 bg-transparent rounded-2xl liquid-glass-outline">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-full bg-background-primary text-white`}>
                      {getActivityIcon(group.nextActivity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                        Next Activity
                      </p>
                      <h3 className="text-lg font-bold text-content-primary line-clamp-2">
                        {group.nextActivity.title}
                      </h3>
                    </div>
                  </div>

                  {/* Activity Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-content-secondary" />
                      <span className="text-sm text-content-secondary">
                        {group.nextActivity.date ? new Date(group.nextActivity.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'Date TBD'}
                      </span>
                    </div>
                    {group.nextActivity.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-content-secondary" />
                        <span className="text-sm text-content-secondary truncate">
                          {group.nextActivity.location}
                        </span>
                      </div>
                    )}
                    {group.nextActivity.participants && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-content-secondary" />
                        <span className="text-sm text-content-secondary">
                          {group.nextActivity.participants} going
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RSVP Button */}
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-lg font-semibold transition-all duration-200 group">
                    <span>RSVP</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Members Modal */}
          <MembersModal
            isOpen={isMembersOpen}
            onClose={() => setIsMembersOpen(false)}
            members={group.members || []}
          />
        </LiquidGlass>
      </motion.div>
    </Link>
  );
}