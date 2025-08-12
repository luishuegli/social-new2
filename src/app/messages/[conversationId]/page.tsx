'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Users, Calendar, MapPin } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import LiquidGlass from '@/components/ui/LiquidGlass';
import GroupCard from '@/components/ui/GroupCard';
import PostCard from '@/components/PostCard';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { useUserGroups } from '@/app/hooks/useUserGroups';
import { useUserPosts } from '@/app/hooks/useUserPosts';
import { useConnections } from '@/app/hooks/useConnections';

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { profile, counts } = useUserProfile(userId);
  const { groups } = useUserGroups(userId);
  const { posts } = useUserPosts(userId);
  const { connections } = useConnections(userId);

  const [tab, setTab] = useState<'profile' | 'groups' | 'connections'>('profile');

  const displayName = profile?.displayName || 'User';
  const avatar = profile?.profilePictureUrl || '';

  return (
    <AppLayout>
      <div className="w-full max-w-5xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div variants={itemVariants}>
            <LiquidGlass className="p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-accent-primary overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      <Image src={avatar} alt={displayName} width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-content-primary">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-content-primary mb-2">{displayName}</h1>
                  <p className="text-content-secondary mb-3">
                    Member of {counts.groups} Groups • {profile?.stats?.activitiesPlannedCount ?? 0} Activities Planned • {counts.posts} Posts
                  </p>
                  {profile?.bio && <p className="text-content-primary leading-relaxed mb-2">{profile.bio}</p>}
                  <div className="flex items-center gap-4 text-sm text-content-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined</span>
                    </div>
                  </div>
                </div>
              </div>
            </LiquidGlass>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LiquidGlass className="p-4 text-center"><div className="text-2xl font-bold text-content-primary mb-1">{counts.groups}</div><div className="text-sm text-content-secondary">Groups</div></LiquidGlass>
              <LiquidGlass className="p-4 text-center"><div className="text-2xl font-bold text-content-primary mb-1">{counts.posts}</div><div className="text-sm text-content-secondary">Posts</div></LiquidGlass>
              <LiquidGlass className="p-4 text-center"><div className="text-2xl font-bold text-content-primary mb-1">{connections.length}</div><div className="text-sm text-content-secondary">Connections</div></LiquidGlass>
              <LiquidGlass className="p-4 text-center"><div className="text-2xl font-bold text-content-primary mb-1">{profile?.stats?.activitiesPlannedCount ?? 0}</div><div className="text-sm text-content-secondary">Planned</div></LiquidGlass>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('profile')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${tab==='profile'?'bg-accent-primary text-content-primary':'bg-background-secondary text-content-secondary'}`}>Profile</button>
            <button onClick={() => setTab('groups')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${tab==='groups'?'bg-accent-primary text-content-primary':'bg-background-secondary text-content-secondary'}`}>Groups ({counts.groups})</button>
            <button onClick={() => setTab('connections')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${tab==='connections'?'bg-accent-primary text-content-primary':'bg-background-secondary text-content-secondary'}`}>Connections ({connections.length})</button>
          </div>

          {/* Tab contents */}
          {tab === 'profile' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4">
                <LiquidGlass className="p-6">
                  <h3 className="font-bold text-content-primary mb-4">Introduction</h3>
                  <p className="text-content-secondary">{profile?.bio || 'No bio provided.'}</p>
                </LiquidGlass>
              </div>
              <div className="md:col-span-8">
                <div className="grid grid-cols-1 gap-4">
                  {posts.map(p => <PostCard key={p.id} post={p} />)}
                  {posts.length === 0 && (
                    <LiquidGlass className="p-6 text-center text-content-secondary">No posts yet.</LiquidGlass>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'groups' && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(g => <GroupCard key={g.id} group={g} />)}
              {groups.length === 0 && <LiquidGlass className="p-6 text-center text-content-secondary">No groups to show.</LiquidGlass>}
            </motion.div>
          )}

          {tab === 'connections' && (
            <motion.div variants={itemVariants}>
              <LiquidGlass className="p-2">
                <div className="divide-y divide-border-separator">
                  {connections.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-accent-primary flex items-center justify-center">
                        {c.other.avatarUrl ? (
                          <Image src={c.other.avatarUrl} alt={c.other.name} width={40} height={40} className="w-full h-full object-cover"/>
                        ) : (
                          <span className="text-sm font-semibold text-content-primary">{c.other.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-content-primary">{c.other.name}</p>
                        <p className="text-xs text-content-secondary">Connected</p>
                      </div>
                    </div>
                  ))}
                  {connections.length === 0 && <div className="p-4 text-center text-content-secondary">No connections yet.</div>}
                </div>
              </LiquidGlass>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
} 