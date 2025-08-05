'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal, Users } from 'lucide-react';
import LiquidGlass from './ui/LiquidGlass';

export default function PostCard({ post, onLike, onComment }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimestamp = (date) => {
    if (!mounted || !date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return postDate.toLocaleDateString();
  };

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      await onLike?.(post.id, newLikedState);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.userName} - ${post.groupName || 'Post'}`,
        text: post.content || post.caption,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <LiquidGlass className="mb-6 overflow-hidden">
        {/* Post Header */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Author Avatar */}
              <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
                {post.userAvatar ? (
                  <Image
                    src={post.userAvatar}
                    alt={post.userName || 'User avatar'}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-content-primary">
                    {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-content-primary">
                    {post.userName}
                  </h3>
                  {post.groupName && (
                    <>
                      <span className="text-content-secondary">•</span>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-content-secondary" />
                        <span className="text-sm text-content-secondary">
                          {post.groupName}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-content-secondary">
                  {formatTimestamp(post.timestamp)}
                </p>
              </div>
            </div>
            
            <button className="text-content-secondary hover:text-content-primary transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <div className="mt-4">
            {post.media.length === 1 ? (
              <div className="relative aspect-square bg-background-secondary">
                {post.media[0].type === 'image' ? (
                  <div className="w-full h-full bg-gradient-to-br from-accent-primary to-support-success opacity-20 flex items-center justify-center">
                    <span className="text-content-secondary font-medium">
                      {post.media[0].alt || 'Image'}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-support-warning to-support-error opacity-20 flex items-center justify-center">
                    <span className="text-content-secondary font-medium">
                      Video Content
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {post.media.slice(0, 4).map((media, index) => (
                  <div key={index} className="relative aspect-square bg-background-secondary">
                    <div className="w-full h-full bg-gradient-to-br from-accent-primary to-support-success opacity-20 flex items-center justify-center">
                      <span className="text-content-secondary text-sm font-medium">
                        {media.alt || `Media ${index + 1}`}
                      </span>
                    </div>
                    {index === 3 && post.media.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Content */}
        <div className="p-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-support-error' : 'text-content-secondary hover:text-support-error'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>
              
              <button
                onClick={handleComment}
                className="flex items-center space-x-2 text-content-secondary hover:text-accent-primary transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{post.comments || 0}</span>
              </button>
            </div>
            
            <button
              onClick={handleShare}
              className="text-content-secondary hover:text-content-primary transition-colors"
            >
              <Share className="w-6 h-6" />
            </button>
          </div>

          {/* Post Caption */}
          {(post.content || post.caption) && (
            <div className="mb-3">
              <p className="text-content-primary leading-relaxed">
                <span className="font-semibold">{post.userName}</span>{' '}
                {post.content || post.caption}
              </p>
            </div>
          )}

          {/* Comments Preview */}
          {post.recentComments && post.recentComments.length > 0 && (
            <div className="space-y-2">
              {post.recentComments.slice(0, 2).map((comment, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold text-content-primary">
                    {comment.author?.name || comment.userName || 'User'}
                  </span>{' '}
                  <span className="text-content-secondary">{comment.text || comment.content}</span>
                </div>
              ))}
              {post.comments > 2 && (
                <button className="text-sm text-content-secondary hover:text-content-primary transition-colors">
                  View all {post.comments} comments
                </button>
              )}
            </div>
          )}
        </div>
      </LiquidGlass>
    </motion.div>
  );
}