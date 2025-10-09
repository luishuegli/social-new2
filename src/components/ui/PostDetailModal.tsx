'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, X, Send } from 'lucide-react';
import { useInstagramLike } from '@/app/hooks/useInstagramLike';
import { useInstagramComments } from '@/app/hooks/useInstagramComments';
import { useAuth } from '@/app/contexts/AuthContext';

interface Post {
  id: string;
  userName?: string;
  authorName?: string;
  authorAvatar?: string;
  imageUrl?: string;
  content?: string;
  likes?: number;
  isLiked?: boolean;
  createdAt: any; // Firestore timestamp
}

interface PostDetailModalProps {
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
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

  const handleDoubleClick = () => {
    if (!likeState.isLiked) {
      handleLike();
    }
  };

  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return '';
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return postTime.toLocaleDateString();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post?.id || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: `Post by ${post.authorName}`,
        text: post.content,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <NextImage
                src={post.authorAvatar || '/default-avatar.svg'}
                alt={post.authorName || 'User avatar'}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
              <div>
                <span className="font-semibold text-white text-sm">
                  {post.authorName}
                </span>
                <span className="block text-xs text-white/60">
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex">
            {/* Image/Content */}
            <div className="flex-1 min-h-0">
              {post.imageUrl && (
                <div className="relative bg-black">
                  <NextImage
                    src={post.imageUrl}
                    alt={post.content || `Post by ${post.authorName}`}
                    width={800}
                    height={800}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: '1/1' }}
                    onDoubleClick={handleDoubleClick}
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
            </div>

            {/* Comments Sidebar */}
            <div className="w-80 border-l border-white/10 flex flex-col">
              {/* Actions */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    disabled={likeState.isLoading}
                    className={`transition-colors ${
                      likeState.isLiked ? 'text-red-500' : 'text-white/60 hover:text-red-500'
                    }`}
                  >
                    <Heart 
                      className="w-6 h-6" 
                      fill={likeState.isLiked ? 'currentColor' : 'none'}
                    />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }} 
                    onClick={handleShare}
                    className="text-white/60 hover:text-green-500 transition-colors"
                  >
                    <Share className="w-6 h-6" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="text-white/60 hover:text-yellow-500 transition-colors"
                  >
                    <Bookmark className="w-6 h-6" />
                  </motion.button>
                  
                  <button className="text-white/60 hover:text-white transition-colors ml-auto">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>

                {/* Likes */}
                {likeState.count > 0 && (
                  <div className="mt-2">
                    <span className="font-semibold text-white text-sm">
                      {likeState.count} {likeState.count === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                )}
              </div>

              {/* Caption */}
              {post.content && (
                <div className="p-4 border-b border-white/10">
                  <span className="font-semibold text-white text-sm mr-2">
                    {post.authorName}
                  </span>
                  <span className="text-white text-sm">
                    {post.content}
                  </span>
                </div>
              )}

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {commentState.comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <NextImage
                      src={comment.authorAvatar || '/default-avatar.svg'}
                      alt={comment.authorName || 'User avatar'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-white/60">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-white text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3 p-4 border-t border-white/10">
                <NextImage
                  src={user?.profilePictureUrl || user?.photoURL || '/default-avatar.svg'}
                  alt={user?.displayName || 'Your avatar'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover flex-shrink-0"
                />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={isSubmittingComment}
                  className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

