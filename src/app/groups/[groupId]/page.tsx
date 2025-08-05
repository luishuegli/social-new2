'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GroupInspector from '../../../components/group/GroupInspector';
import GroupChat from '../../../components/group/GroupChat';
import GroupPosts from '../../../components/group/GroupPosts';
import { mockGroups } from '../../utils/mockGroups';

interface GroupPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupPage({ params }: GroupPageProps) {
  const { groupId } = React.use(params);
  const [activeView, setActiveView] = useState('chat');
  
  // Find the group data - in real app, this would be an API call
  const group = mockGroups.find(g => g.id === groupId) || {
    // Fallback data for any group ID
    id: groupId,
    name: 'Group Details',
    description: 'This is a group page. In a real application, this would load the specific group data from your API.',
    memberCount: 0,
    members: [],
    joined: false,
    nextActivity: null,
    category: 'General'
  };

  return (
    <div className="min-h-screen has-mesh-gradient">
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
              <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setActiveView('chat')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeView === 'chat'
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveView('posts')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeView === 'posts'
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Posts
                </button>
              </div>
            </div>
          </motion.div>

          {/* Conditional Content */}
          {activeView === 'chat' ? (
            <GroupChat group={group} />
          ) : (
            <GroupPosts group={group} />
          )}
        </div>

        {/* Inspector Column (Right) */}
        <div className="lg:col-span-1">
          <GroupInspector group={group} />
        </div>
      </div>
    </div>
  );
} 