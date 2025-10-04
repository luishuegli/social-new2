'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PostCard from '@/components/PostCard';
import { Zap, Users as UsersIcon, Globe, Lock } from 'lucide-react';

interface PortfolioPostCardProps {
  post: any;
  className?: string;
}

export default function PortfolioPostCard({ post, className }: PortfolioPostCardProps) {
  const isLive = post?.authenticityType === 'Live Post';
  const isCollab = post?.postType === 'Collaborative';
  const showLive = isLive;
  const showCollab = !showLive && isCollab;
  const visibility: 'public' | 'followers' | 'private' | undefined = post?.visibility;

  return (
    <div className={`relative ${className || ''}`}>
      {/* Badge */}
      {(showLive || showCollab) && (
        <motion.div
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md ${
            showLive
              ? 'bg-green-500/20 text-green-300 border border-green-400'
              : 'bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/30'
          }`}
        >
          {showLive ? <Zap className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />}
          {showLive ? 'LIVE' : 'Collab'}
        </motion.div>
      )}

      {/* PostCard expects a plain object; we forward essential props */}
      <PostCard post={post as any} onLike={() => {}} onComment={() => {}} />

      {/* Visibility chip bottom-left */}
      {visibility && (
        <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm flex items-center gap-1">
          {visibility === 'public' && <Globe className="w-3 h-3" />}
          {visibility === 'followers' && <UsersIcon className="w-3 h-3" />}
          {visibility === 'private' && <Lock className="w-3 h-3" />}
          <span className="capitalize">{visibility}</span>
        </div>
      )}
    </div>
  );
}


