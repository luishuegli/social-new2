'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import PostCard from '../../components/PostCard';
import { usePosts } from '../hooks/usePosts';

// Animation variants for staggered list animations
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each child animates 0.1s after the previous one
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

export default function HomePage() {
  const { posts, loading, error, handleLike, handleComment } = usePosts();

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
        >
          <h1 className="text-heading-1 font-bold text-content-primary mb-2 sm:mb-3">
            Live Posts
          </h1>
          <p className="text-content-secondary text-body">
            Stay connected with the latest updates from all your groups.
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-accent-primary liquid-glass-square flex items-center justify-center"></div>
              <span className="ml-3 text-content-secondary">Loading posts...</span>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="text-center py-12">
              <p className="text-content-secondary mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-accent-primary text-content-primary rounded-card hover:bg-opacity-80 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 liquid-glass-square flex items-center justify-center">
                <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-content-primary font-semibold mb-2">No posts yet</h3>
              <p className="text-content-secondary">Join some groups to see their latest posts here.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <PostCard 
                  post={post} 
                  onLike={handleLike}
                  onComment={handleComment}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}