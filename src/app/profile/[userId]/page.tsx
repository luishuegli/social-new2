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
import GroupCard from '@/components/ui/GroupCard';
import PostCard from '@/components/PostCard';

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

  const [activeTab, setActiveTab] = React.useState<'portfolio' | 'groups'>('portfolio');

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

          {/* Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <LiquidGlass className="p-2">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'portfolio' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'groups' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Groups
                </button>
              </div>
            </LiquidGlass>
          </motion.div>

          {/* Tab Content */}
          <motion.div variants={itemVariants}>
            {activeTab === 'portfolio' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((p: any) => (
                  <PostCard key={p.id} post={{
                    id: p.id,
                    imageUrl: p.imageUrl,
                    userAvatar: user.avatar,
                    userName: user.name,
                    timestamp: new Date().toLocaleString(),
                    content: (p as any).description || (p as any).activityTitle || '',
                    likes: p.likes || 0,
                    comments: p.comments || 0,
                  }} />
                ))}
                {posts.length === 0 && (
                  <LiquidGlass className="p-6 text-center text-content-secondary">No posts yet.</LiquidGlass>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
                {groups.length === 0 && (
                  <LiquidGlass className="p-6 text-center text-content-secondary">No groups yet.</LiquidGlass>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}