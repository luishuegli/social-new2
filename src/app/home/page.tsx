'use client';

import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import InstagramPostCard from '../../components/ui/InstagramPostCard';
import { usePaginatedPosts } from '@/hooks/usePaginatedPosts';
import { listContainerVariants, listItemVariants, fadeInVariants, slideDownVariants, scaleInVariants } from '../constants/animations';

export default function HomePage() {
  const { posts, loading, hasMore, error, loadMore, triggerRef } = usePaginatedPosts({
    enableInfiniteScroll: true
  });

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
            Feed
          </h1>
          <p className="text-content-secondary text-body">
            Stay connected with the latest updates from all your groups.
          </p>
        </motion.div>


        {/* Client posts list */}
        {posts.length > 0 && (
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mb-6"
          >
            {posts.map((p) => (
              <motion.div key={p.id} variants={listItemVariants}>
                <InstagramPostCard post={p} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Infinite scroll trigger */}
        {triggerRef && (
          <div ref={triggerRef} className="flex justify-center py-4">
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-primary"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading more posts...</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading && posts.length === 0 ? (
          <motion.div 
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-accent-primary liquid-glass-square flex items-center justify-center"></div>
              <span className="ml-3 text-content-secondary">Loading posts...</span>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="text-center py-12">
              <p className="text-content-secondary mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-accent-primary text-background-primary rounded-card hover:bg-opacity-80 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div 
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
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
              <p className="text-content-secondary mb-4">Create your first post or seed demo content.</p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="/posts/create"
                  className="px-4 py-2 bg-accent-primary text-background-primary rounded-card hover:bg-opacity-80 transition-colors"
                >
                  Create a Post
                </a>
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/seed-all', { method: 'POST' });
                      window.location.reload();
                    } catch (e) {
                      if (process.env.NODE_ENV === 'development') {
                        console.error('Seeding failed', e);
                      }
                    }
                  }}
                  className="px-4 py-2 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
                >
                  Seed Demo Content
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </AppLayout>
  );
}