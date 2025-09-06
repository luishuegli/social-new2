'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, Camera, MoreHorizontal } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

// Mock data for group posts
const mockPosts = [
  {
    id: '1',
    author: { name: 'Alex Chen', avatar: null },
    timestamp: '2 hours ago',
    content: 'Captured this amazing sunset during our street photography walk! The golden hour lighting was absolutely perfect.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    likes: 24,
    comments: 8,
    type: 'photo'
  },
  {
    id: '2',
    author: { name: 'Sarah Wilson', avatar: null },
    timestamp: '5 hours ago',
    content: 'Quick tip: Try using leading lines to draw the viewer\'s eye into your composition. This bridge shot is a perfect example!',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=500&fit=crop',
    likes: 18,
    comments: 12,
    type: 'photo'
  },
  {
    id: '3',
    author: { name: 'Mike Rodriguez', avatar: null },
    timestamp: '1 day ago',
    content: 'Behind the scenes from yesterday\'s portrait session. Sometimes the candid moments between shots are the most genuine.',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=400&fit=crop',
    likes: 31,
    comments: 6,
    type: 'photo'
  },
  {
    id: '4',
    author: { name: 'Emma Thompson', avatar: null },
    timestamp: '2 days ago',
    content: 'Experimenting with macro photography in my garden. Nature provides the most incredible textures and patterns when you look closely.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    likes: 27,
    comments: 9,
    type: 'photo'
  },
  {
    id: '5',
    author: { name: 'David Kim', avatar: null },
    timestamp: '3 days ago',
    content: 'Night photography challenge completed! Here\'s my attempt at capturing the city lights. Long exposure is definitely an art form.',
    image: '/api/placeholder/400/600',
    likes: 42,
    comments: 15,
    type: 'photo'
  },
  {
    id: '6',
    author: { name: 'Lisa Anderson', avatar: null },
    timestamp: '4 days ago',
    content: 'Found this incredible mural during today\'s urban exploration. Street art photography is becoming one of my favorite genres.',
    image: '/api/placeholder/300/500',
    likes: 19,
    comments: 4,
    type: 'photo'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

export default function GroupPosts() {
  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">Feed</h2>
          <p className="text-content-secondary">Share your photography journey with the group</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-accent-primary text-background-primary rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200">
          <Camera className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </div>

      {/* Posts Grid - Masonry Layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
      >
        {mockPosts.map((post) => (
          <motion.div
            key={post.id}
            variants={itemVariants}
            className="break-inside-avoid"
          >
            <LiquidGlass className="p-4 overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center">
                    <span className="text-sm font-semibold text-content-primary">
                      {post.author.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-content-primary text-sm">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-content-secondary">
                      {post.timestamp}
                    </p>
                  </div>
                </div>
                <button className="text-content-secondary hover:text-content-primary">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <p className="text-content-secondary text-sm leading-relaxed mb-3">
                {post.content}
              </p>

              {/* Post Image */}
              <div className="mb-3 rounded-xl overflow-hidden bg-background-secondary">
                <div 
                  className="w-full bg-gradient-to-br from-accent-primary to-support-success opacity-20"
                  style={{ aspectRatio: '4/3' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-content-secondary" />
                  </div>
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-content-secondary hover:text-support-error transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-content-secondary hover:text-accent-primary transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                </div>
                <button className="text-content-secondary hover:text-content-primary transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </LiquidGlass>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}