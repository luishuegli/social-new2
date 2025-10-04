'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, UserPlus } from 'lucide-react';
import { useInstagramLike } from '@/app/hooks/useInstagramLike';
import { useInstagramComments } from '@/app/hooks/useInstagramComments';
import { useAuth } from '@/app/contexts/AuthContext';
import LiquidGlass from './LiquidGlass';
import CommentModal from './CommentModal';
import PostDetailModal from './PostDetailModal';

export default function InstagramPostCard({ post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { likeState, toggleLike } = useInstagramLike(
    post.id, 
    post.likes || 0, 
    post.isLiked || false
  );

  const { commentState } = useInstagramComments(post.id);

  const handleLike = async () => {
    try {
      await toggleLike();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return postTime.toLocaleDateString();
  };

  const handleDoubleClick = () => {
    if (!likeState.isLiked) {
      handleLike();
    }
  };

  const handleImageClick = () => {
    setShowPostDetail(true);
  };

  if (!post) return null;

  return (
    <>
      <LiquidGlass className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            <NextImage
              src={post.userAvatar || post.authorAvatar || '/default-avatar.svg'}
              alt={post.userName || post.authorName || 'User avatar'}
              width={40}
              height={40}
              className="rounded-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', post.userAvatar || post.authorAvatar);
                console.error('Error details:', e);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', post.userAvatar || post.authorAvatar);
              }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-content-primary text-sm">
                  {post.userName || post.authorName}
                </span>
                {post.authenticityType === 'Live Post' && (
                  <div className="px-1.5 py-0.5 bg-green-500/20 border border-green-400 rounded-full text-xs font-semibold text-green-300">
                    LIVE
                  </div>
                )}
              </div>
              <span className="text-xs text-content-secondary">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
          <button className="p-1 hover:bg-background-secondary rounded-full">
            <MoreHorizontal className="w-5 h-5 text-content-secondary" />
          </button>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div 
            className="relative bg-background-secondary cursor-pointer"
            onDoubleClick={handleDoubleClick}
            onClick={handleImageClick}
          >
            <NextImage
              src={post.imageUrl}
              alt={post.content || `Post by ${post.authorName || 'user'}`}
              width={600}
              height={600}
              className="w-full h-auto object-cover"
              style={{ aspectRatio: '1/1' }}
            />
            
            {/* Double-tap like animation */}
            <AnimatePresence>
              {likeState.isLiked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-20 h-20 text-red-500" fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={likeState.isLoading}
                className={`transition-colors ${
                  likeState.isLiked ? 'text-red-500' : 'text-content-secondary hover:text-red-500'
                }`}
              >
                <Heart 
                  className="w-6 h-6" 
                  fill={likeState.isLiked ? 'currentColor' : 'none'}
                />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(true)}
                className="text-content-secondary hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="text-content-secondary hover:text-green-500 transition-colors"
              >
                <Share className="w-6 h-6" />
              </motion.button>
            </div>
            
            <button className="text-content-secondary hover:text-yellow-500 transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          {/* Likes */}
          {likeState.count > 0 && (
            <div className="mb-2">
              <span className="font-semibold text-content-primary text-sm">
                {likeState.count} {likeState.count === 1 ? 'like' : 'likes'}
              </span>
            </div>
          )}

          {/* Caption */}
          {post.content && (
            <div className="mb-2">
              <span className="font-semibold text-content-primary text-sm mr-2">
                {post.authorName}
              </span>
              <span className="text-content-primary text-sm">
                {post.content}
              </span>
            </div>
          )}

          {/* Comments preview */}
          {commentState.comments.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowComments(true)}
                className="text-content-secondary hover:text-content-primary text-sm transition-colors"
              >
                View all {commentState.comments.length} comments
              </button>
              
              {/* Show last 2 comments */}
              <div className="mt-1 space-y-1">
                {commentState.comments.slice(-2).map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <span className="font-semibold text-content-primary mr-2">
                      {comment.authorName}
                    </span>
                    <span className="text-content-primary">
                      {comment.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time */}
          <div className="text-xs text-content-secondary uppercase tracking-wide">
            {formatTimeAgo(post.createdAt)}
          </div>
        </div>

        {/* Comment input */}
        <div className="px-4 pb-4 border-t border-border-separator pt-3">
          <div className="flex items-center space-x-3">
            <NextImage
              src={user?.profilePictureUrl || user?.photoURL || '/default-avatar.svg'}
              alt={user?.displayName || 'Your avatar'}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <button
              onClick={() => setShowComments(true)}
              className="flex-1 text-left text-content-secondary hover:text-content-primary text-sm transition-colors"
            >
              Add a comment...
            </button>
          </div>
        </div>
      </LiquidGlass>

      {/* Comment Modal */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        post={post}
        onLike={handleLike}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        post={post}
        isOpen={showPostDetail}
        onClose={() => setShowPostDetail(false)}
      />
    </>
  );
}