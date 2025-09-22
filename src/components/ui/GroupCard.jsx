'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, MessageSquare, Image as ImageIcon, Vote } from 'lucide-react';
import MembersModal from './MembersModal';
import LiquidGlass from './LiquidGlass';
import GroupCardRSVP from './GroupCardRSVP';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GroupCard({ group }) {
  const { user } = useAuth?.() || { user: null };
  const [isMembersOpen, setIsMembersOpen] = React.useState(false);
  // Display the first 3-4 member avatars
  const displayMembers = group.members?.slice(0, 4) || [];
  const remainingCount = (group.members?.length || 0) - displayMembers.length;

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };


  return (
    <Link href={`/groups/${group.id}`} className="block h-full">
      <motion.div
        layoutId={`group-card-container-${group.id}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="h-full"
      >
        <LiquidGlass className="p-4 h-full flex flex-col">
          {/* Card Header - Group Name Only */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-content-primary">
              {group.name}
            </h3>
          </div>

          {/* Members Section - Moved Below Group Name */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); } }}
              className="flex -space-x-3 focus:outline-none"
              aria-label="View members"
            >
              {displayMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full border-2 border-background-primary overflow-hidden bg-background-secondary flex items-center justify-center"
                  style={{ zIndex: displayMembers.length - index }}
                >
                                      {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-content-primary">
                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                  <span className="text-xs font-semibold text-content-primary">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </button>
            {/* Members count button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="ml-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-content-secondary"
              aria-label="View members"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">{group.memberCount || group.members?.length || 0}</span>
            </button>
          </div>

          {/* Card Body - Recent Activity */}
          <div className="flex-1 mb-3">
            {group.latestActivity ? (
              <div className="space-y-2">
                {/* Activity Type Header */}
                <div className="flex items-center space-x-2">
                  {group.latestActivity.type === 'message' && (
                    <MessageSquare className="w-4 h-4 text-accent-primary" />
                  )}
                  {group.latestActivity.type === 'post' && (
                    <ImageIcon className="w-4 h-4 text-accent-primary" />
                  )}
                  {group.latestActivity.type === 'poll' && (
                    <Vote className="w-4 h-4 text-accent-primary" />
                  )}
                  <span className="text-xs font-medium text-content-secondary">
                    {formatTimestamp(group.latestActivity.timestamp)}
                  </span>
                </div>

                {/* Activity Content */}
                {group.latestActivity.type === 'message' && (
                  <div className="flex items-start space-x-2">
                    {group.latestActivity.author && (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-accent-primary flex-shrink-0">
                        {group.latestActivity.author.avatarUrl ? (
                          <Image
                            src={group.latestActivity.author.avatarUrl}
                            alt={group.latestActivity.author.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-content-primary">
                              {group.latestActivity.author.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {group.latestActivity.author && (
                        <p className="text-xs font-semibold text-content-primary mb-1">
                          {group.latestActivity.author.name}
                        </p>
                      )}
                      <p className="text-sm text-content-secondary line-clamp-2">
                        {group.latestActivity.content}
                      </p>
                    </div>
                  </div>
                )}

                {group.latestActivity.type === 'post' && (
                  <div className="space-y-2">
                    {group.latestActivity.imageUrl && (
                      <div className="relative h-16 rounded-lg overflow-hidden bg-background-secondary">
                        <Image
                          src={group.latestActivity.imageUrl}
                          alt="Post thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-content-secondary">
                      {group.latestActivity.content}
                    </p>
                  </div>
                )}

                {group.latestActivity.type === 'poll' && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-content-primary">
                      {group.latestActivity.pollQuestion || group.latestActivity.content}
                    </p>
                    <p className="text-xs text-content-secondary">
                      New poll created
                    </p>
                  </div>
                )}

                {group.latestActivity.type === 'join' && (
                  <div className="space-y-1">
                    <p className="text-sm text-content-secondary">
                      <span className="font-semibold text-content-primary">{group.latestActivity.author || 'Someone'}</span> joined the group
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-content-secondary text-sm leading-relaxed line-clamp-3">
                {group.description}
              </p>
            )}
          </div>

          {/* Card Footer - Activity Status and RSVP Button */}
          <div className="pt-3 border-t border-border-separator mt-auto">
            {group.nextActivity && (
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-accent-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-content-secondary">Next Up:</span>
                  <p className="text-sm font-bold text-content-primary truncate" style={{color: '#10b981'}}>
                    {group.nextActivity.title}
                  </p>
                  <p className="text-xs text-content-secondary">
                    {group.nextActivity.date ? new Date(group.nextActivity.date).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>
            )}
            <GroupCardRSVP group={group} />
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