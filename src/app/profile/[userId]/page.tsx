'use client';

import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Users, Calendar, MapPin } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import LiquidGlass from '@/components/ui/LiquidGlass';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { useUserGroups } from '@/app/hooks/useUserGroups';
import { useUserPosts } from '@/app/hooks/useUserPosts';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { profile, counts } = useUserProfile(userId);
  const { groups } = useUserGroups(userId);
  const { posts } = useUserPosts(userId);
  const user = {
    id: userId,
    name: profile?.displayName || 'User',
    avatar: profile?.profilePictureUrl || '',
    bio: profile?.bio || '',
    location: '',
    memberSince: new Date().toISOString(),
    stats: {
      groupsCount: counts?.groups || groups.length || 0,
      activitiesPlanned: profile?.stats?.activitiesPlannedCount || 0,
      activitiesJoined: 0,
      postsCount: posts.length || 0,
    },
    publicGroups: groups.map(g => ({ id: g.id, name: g.name, category: g.category || 'General', memberCount: g.memberCount || 0, role: 'member' })),
  };

  const formatMemberSince = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-accent-primary rounded-full text-xs font-medium text-content-primary">
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-support-warning rounded-full text-xs font-medium text-content-primary">
            Moderator
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Profile Header */}
          <motion.div variants={itemVariants}>
            <LiquidGlass className="p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-content-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-content-primary mb-2">
                    {user.name}
                  </h1>
                  
                  {/* Stats Line */}
                  <p className="text-content-secondary mb-3">
                    Member of {user.stats.groupsCount} Groups • {user.stats.activitiesPlanned} Activities Planned • {user.stats.postsCount} Posts
                  </p>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-content-primary leading-relaxed mb-3">
                      {user.bio}
                    </p>
                  )}

                  {/* Additional Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary">
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatMemberSince(user.memberSince)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </LiquidGlass>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LiquidGlass className="p-4 text-center">
                <div className="text-2xl font-bold text-content-primary mb-1">
                  {user.stats.groupsCount}
                </div>
                <div className="text-sm text-content-secondary">Groups</div>
              </LiquidGlass>
              
              <LiquidGlass className="p-4 text-center">
                <div className="text-2xl font-bold text-content-primary mb-1">
                  {user.stats.activitiesPlanned}
                </div>
                <div className="text-sm text-content-secondary">Planned</div>
              </LiquidGlass>
              
              <LiquidGlass className="p-4 text-center">
                <div className="text-2xl font-bold text-content-primary mb-1">
                  {user.stats.activitiesJoined}
                </div>
                <div className="text-sm text-content-secondary">Joined</div>
              </LiquidGlass>
              
              <LiquidGlass className="p-4 text-center">
                <div className="text-2xl font-bold text-content-primary mb-1">
                  {user.stats.postsCount}
                </div>
                <div className="text-sm text-content-secondary">Posts</div>
              </LiquidGlass>
            </div>
          </motion.div>

          {/* Public Groups */}
          <motion.div variants={itemVariants}>
            <LiquidGlass className="p-6">
              <h2 className="text-xl font-bold text-content-primary mb-4">
                Public Groups
              </h2>
              
              {user.publicGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-content-secondary mx-auto mb-3" />
                  <p className="text-content-secondary">No public groups to display</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.publicGroups.map((group) => (
                    <LiquidGlass key={group.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-content-primary">
                          {group.name}
                        </h3>
                        {getRoleBadge(group.role)}
                      </div>
                      
                      <p className="text-sm text-content-secondary mb-2">
                        {group.category}
                      </p>
                      
                      <div className="flex items-center space-x-1 text-sm text-content-secondary">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount} members</span>
                      </div>
                    </LiquidGlass>
                  ))}
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}