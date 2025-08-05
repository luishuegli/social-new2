'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function GroupPosts({ group }) {
  // Use group parameter to avoid ESLint warning
  if (!group) return null;
  // Mock posts data - in real app, this would come from API
  const mockPosts = [
    {
      id: 'post-1',
      title: 'Sunset at the Beach',
      content: 'Amazing sunset session today! The light was absolutely perfect.',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      author: {
        name: 'Sarah Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8
    },
    {
      id: 'post-2',
      title: 'Mountain Hiking Trip',
      content: 'Incredible views from the summit today. Worth every step!',
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
      author: {
        name: 'Mike Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '1 day ago',
      likes: 31,
      comments: 12
    },
    {
      id: 'post-3',
      title: 'City Photography Workshop',
      content: 'Great session learning street photography techniques.',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
      author: {
        name: 'Emma Davis',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '3 days ago',
      likes: 18,
      comments: 5
    },
    {
      id: 'post-4',
      title: 'Portrait Session',
      content: 'Beautiful natural light portraits from today\'s session.',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=400&fit=crop',
      author: {
        name: 'Alex Rodriguez',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '1 week ago',
      likes: 42,
      comments: 15
    },
    {
      id: 'post-5',
      title: 'Street Photography',
      content: 'Capturing the urban landscape in black and white.',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      author: {
        name: 'Lisa Wang',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '1 week ago',
      likes: 29,
      comments: 7
    }
  ];

  const handleLike = (postId) => {
    // TODO: Implement like functionality
    console.log('Liked post:', postId);
  };

  const handleComment = (postId) => {
    // TODO: Implement comment functionality
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  return (
    <LiquidGlass className="p-6">
      <div className="space-y-6">
        {/* Posts Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Group Posts</h2>
            <button className="text-white/70 hover:text-white transition-colors duration-200 text-sm font-medium">
              Create Post
            </button>
          </div>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="overflow-hidden bg-white/10 backdrop-blur-sm rounded-lg">
                {/* Post Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Post Content */}
                <div className="p-4">
                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                        {post.author.avatarUrl ? (
                          <Image
                            src={post.author.avatarUrl}
                            alt={post.author.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {post.author.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{post.author.name}</p>
                        <p className="text-xs text-white/50">{post.timestamp}</p>
                      </div>
                    </div>
                    <button className="p-1 text-white/50 hover:text-white transition-colors duration-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Post Title and Content */}
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white mb-1">{post.title}</h3>
                    <p className="text-sm text-white/70 line-clamp-2">{post.content}</p>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-1 text-white/50 hover:text-white transition-colors duration-200"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-xs">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => handleComment(post.id)}
                        className="flex items-center space-x-1 text-white/50 hover:text-white transition-colors duration-200"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{post.comments}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="text-white/50 hover:text-white transition-colors duration-200"
                    >
                      <Share className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </LiquidGlass>
  );
} 