'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GroupInspector from '../../../components/group/GroupInspector';
import GroupChat from '../../../components/group/GroupChat';
import GroupPosts from '../../../components/group/GroupPosts';
import { db } from '../../Lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import ActivityPlanModal from '../../../components/ui/ActivityPlanModal';

interface GroupPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId } = React.use(params);
  const [activeView, setActiveView] = useState('chat');
  const [group, setGroup] = useState<any | null>(null);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlanActivity = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  React.useEffect(() => {
    const ref = doc(db, 'groups', groupId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data: any = snap.data();
        const memberIds: string[] = Array.isArray(data.members) ? data.members : [];
        const fetchProfiles = async (ids: string[]) => {
          // Fetch profiles for all member ids so the members modal can show the full list
          const results = await Promise.all(
            ids.map(async (uid) => {
              const uref = doc(db, 'users', uid);
              const usnap = await getDoc(uref);
              if (usnap.exists()) {
                const u: any = usnap.data();
                return { id: uid, name: u.displayName || 'User', avatarUrl: u.profilePictureUrl || '' };
              }
              return { id: uid, name: 'User', avatarUrl: '' };
            })
          );
          return results;
        };

        fetchProfiles(memberIds).then((profiles) => {
          setGroup({
            id: snap.id,
            name: data.groupName || 'Group',
            description: data.description || '',
            memberCount: memberIds.length || 0,
            members: profiles,
            joined: user ? memberIds.includes(user.uid) : false,
            nextActivity: data.nextActivity || null,
            category: data.category || 'General'
          });
        });
      } else {
        setGroup({ id: groupId, name: 'Group Details', description: 'Group not found', memberCount: 0, members: [], joined: false, nextActivity: null, category: 'General' });
      }
    });
    return () => unsub();
  }, [groupId, user?.uid]);

  return (
    <>
      <div className="min-h-screen">
        {/* Back Button */}
        <div className="p-6">
          <Link 
            href="/groups" 
            className="inline-flex items-center space-x-2 text-content-secondary hover:text-content-primary transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Groups</span>
          </Link>
        </div>

        {/* Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Main Content Column (Left) */}
          <div className="lg:col-span-2">
            {/* View Toggle - Now wrapped in LiquidGlass */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-6"
            >
              <div className="liquid-glass p-4">
                <div className="flex bg-background-secondary/50 backdrop-blur-sm rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeView === 'chat'
                        ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                        : 'text-content-secondary hover:text-content-primary hover:bg-background-secondary'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveView('posts')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeView === 'posts'
                        ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                        : 'text-content-secondary hover:text-content-primary hover:bg-background-secondary'
                    }`}
                  >
                    Posts
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Conditional Content */}
            <div>
              {activeView === 'chat' ? (
                group && group.joined ? (
                  <div className="h-full max-h-[calc(100vh-200px)] overflow-y-auto">
                    <GroupChat group={group} />
                  </div>
                ) : (
                  <div className="liquid-glass p-6">
                    <p className="text-content-secondary">Join this group to view and send messages.</p>
                  </div>
                )
              ) : (
                group && <GroupPosts group={group} />
              )}
            </div>
          </div>

          {/* Inspector Column (Right) */}
          <div className="lg:col-span-1 sticky top-6 self-start">
            {group && <GroupInspector group={group} onPlanActivity={handlePlanActivity} />}
          </div>
        </div>
      </div>
      {group && (
        <ActivityPlanModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          groupName={group.name}
          groupId={group.id}
        />
      )}
    </>
  );
} 