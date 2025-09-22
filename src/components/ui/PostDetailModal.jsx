'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, X, UserPlus, Send } from 'lucide-react';
import { useInstagramLike } from '@/app/hooks/useInstagramLike';
import { useInstagramComments } from '@/app/hooks/useInstagramComments';
import { useAuth } from '@/app/contexts/AuthContext';
import LiquidGlass from './LiquidGlass';

export default function PostDetailModal({ post, isOpen, onClose }) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const { likeState, toggleLike } = useInstagramLike(
    post?.id, 
    post?.likes || 0, 
    post?.isLiked || false
  );

  const { commentState, addComment } = useInstagramComments(post?.id);

  const handleLike = async () => {
    try {
      await toggleLike();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
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

  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-background-primary rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex h-full">
              {/* Image Section */}
              <div className="flex-1 bg-black flex items-center justify-center">
                {post.imageUrl && (
                  <div 
                    className="relative w-full h-full max-h-[90vh] flex items-center justify-center cursor-pointer"
                    onDoubleClick={handleDoubleClick}
                  >
                    <NextImage
                      src={post.imageUrl}
                      alt={post.content || `Post by ${post.authorName || 'user'}`}
                      width={800}
                      height={800}
                      className="max-w-full max-h-full object-contain"
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
                          <Heart className="w-32 h-32 text-red-500" fill="currentColor" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="w-80 bg-background-primary flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-separator">
                  <div className="flex items-center space-x-3">
                    <NextImage
                      src={post.authorAvatar || '/default-avatar.png'}
                      alt={post.authorName || 'User avatar'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-content-primary text-sm">
                        {post.authorName}
                      </div>
                      {post.authenticityType && (
                        <div className="text-xs text-accent-primary">
                          {post.authenticityType}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="p-1 hover:bg-background-secondary rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-content-secondary" />
                  </button>
                </div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Caption */}
                  <div className="flex space-x-3">
                    <NextImage
                      src={post.authorAvatar || '/default-avatar.png'}
                      alt={post.authorName || 'User avatar'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold text-content-primary mr-2">
                          {post.authorName}
                        </span>
                        <span className="text-content-primary">
                          {post.content}
                        </span>
                      </div>
                      <div className="text-xs text-content-secondary mt-1">
                        {formatTimeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {commentState.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <NextImage
                        src={comment.authorAvatar || '/default-avatar.png'}
                        alt={comment.authorName || 'User avatar'}
                        width={32}
                        height={32}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-semibold text-content-primary mr-2">
                            {comment.authorName}
                          </span>
                          <span className="text-content-primary">
                            {comment.text}
                          </span>
                        </div>
                        <div className="text-xs text-content-secondary mt-1">
                          {formatTimeAgo(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {commentState.comments.length === 0 && (
                    <div className="text-center text-content-secondary text-sm py-8">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-border-separator">
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

                  {/* Time */}
                  <div className="text-xs text-content-secondary uppercase tracking-wide mb-3">
                    {formatTimeAgo(post.createdAt)}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3">
                    <NextImage
                      src={user?.profilePictureUrl || user?.photoURL || '/default-avatar.png'}
                      alt={user?.displayName || 'Your avatar'}
                      width={24}
                      height={24}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-content-primary placeholder-content-secondary text-sm outline-none"
                      disabled={isSubmittingComment}
                    />
                    <motion.button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      whileTap={{ scale: 0.9 }}
                      className={`transition-colors ${
                        newComment.trim() && !isSubmittingComment
                          ? 'text-accent-primary hover:text-accent-primary/80'
                          : 'text-content-secondary'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}