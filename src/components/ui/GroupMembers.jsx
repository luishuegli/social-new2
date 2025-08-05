'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Crown, Shield, MoreHorizontal, MessageSquare } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

// Mock data for group members
const mockMembers = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'admin',
    avatar: null,
    joinDate: '2023-01-15',
    bio: 'Professional photographer specializing in street and portrait photography. Love capturing authentic moments.',
    postsCount: 47,
    isOnline: true
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    role: 'moderator',
    avatar: null,
    joinDate: '2023-02-03',
    bio: 'Nature and landscape photographer. Always chasing the perfect golden hour shot.',
    postsCount: 32,
    isOnline: true
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    role: 'member',
    avatar: null,
    joinDate: '2023-03-12',
    bio: 'Wedding photographer by day, street photographer by night. Canon enthusiast.',
    postsCount: 28,
    isOnline: false
  },
  {
    id: '4',
    name: 'Emma Thompson',
    role: 'member',
    avatar: null,
    joinDate: '2023-03-20',
    bio: 'Macro and wildlife photography lover. Currently exploring underwater photography.',
    postsCount: 21,
    isOnline: true
  },
  {
    id: '5',
    name: 'David Kim',
    role: 'member',
    avatar: null,
    joinDate: '2023-04-05',
    bio: 'Architecture and urban photography. Sony mirrorless camera advocate.',
    postsCount: 19,
    isOnline: false
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    role: 'member',
    avatar: null,
    joinDate: '2023-04-18',
    bio: 'Portrait and fashion photographer. Love experimenting with creative lighting techniques.',
    postsCount: 15,
    isOnline: true
  },
  {
    id: '7',
    name: 'James Foster',
    role: 'member',
    avatar: null,
    joinDate: '2023-05-02',
    bio: 'Sports and action photography specialist. Always ready for the next adventure.',
    postsCount: 12,
    isOnline: false
  },
  {
    id: '8',
    name: 'Maria Santos',
    role: 'member',
    avatar: null,
    joinDate: '2023-05-15',
    bio: 'Documentary photographer focusing on social issues and human stories.',
    postsCount: 9,
    isOnline: true
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function GroupMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, online, admins

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-accent-primary" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-support-warning" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-accent-primary rounded-full text-xs font-medium text-content-primary">
            <Crown className="w-3 h-3" />
            <span>Admin</span>
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-support-warning rounded-full text-xs font-medium text-content-primary">
            <Shield className="w-3 h-3" />
            <span>Mod</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'online' && member.isOnline) ||
      (filter === 'admins' && (member.role === 'admin' || member.role === 'moderator'));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">Group Members</h2>
          <p className="text-content-secondary">
            {mockMembers.length} photographers in this community
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-accent-primary text-content-primary rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 self-start">
          <UserPlus className="w-5 h-5" />
          <span>Invite Members</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-border-separator rounded-xl text-content-primary placeholder-content-secondary focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'online', label: 'Online' },
            { id: 'admins', label: 'Staff' }
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`
                px-4 py-2 rounded-xl font-medium transition-all duration-200
                ${filter === filterOption.id
                  ? 'bg-accent-primary text-content-primary'
                  : 'bg-background-secondary text-content-secondary hover:text-content-primary hover:bg-opacity-80'
                }
              `}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredMembers.map((member) => (
          <motion.div
            key={member.id}
            variants={itemVariants}
          >
            <LiquidGlass className="p-4 hover:scale-105 transition-transform duration-200">
              {/* Member Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center">
                      <span className="text-lg font-semibold text-content-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    {member.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-support-success rounded-full border-2 border-background-primary"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-content-primary truncate">
                        {member.name}
                      </h3>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-xs text-content-secondary">
                      Joined {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button className="text-content-secondary hover:text-content-primary">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Member Bio */}
              <p className="text-sm text-content-secondary leading-relaxed mb-3 line-clamp-3">
                {member.bio}
              </p>

              {/* Member Stats */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-content-secondary">
                  <span className="font-medium text-content-primary">{member.postsCount}</span> posts
                </div>
                {getRoleBadge(member.role)}
              </div>

              {/* Action Button */}
              <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-background-secondary hover:bg-accent-primary hover:text-content-primary text-content-secondary rounded-xl transition-all duration-200 font-medium">
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>
            </LiquidGlass>
          </motion.div>
        ))}
      </motion.div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-content-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-2">No members found</h3>
          <p className="text-content-secondary">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
}