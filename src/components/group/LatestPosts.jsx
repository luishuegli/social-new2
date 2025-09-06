'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import { db } from '@/app/Lib/firebase';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';

export default function LatestPosts({ group }) {
  if (!group) return null;
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const refCol = collection(db, 'posts');
    const q = query(refCol, where('groupId', '==', group.id), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            title: data.title || data.activityTitle || 'Post',
            imageUrl: data.media?.[0]?.url || '',
            author: data.authorName || data.authorId || 'User',
            timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        setPosts(items);
      },
      (err) => {
        console.warn('LatestPosts listener permission error:', err?.message || err);
        setPosts([]);
      }
    );
    return () => unsub();
  }, [group.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
    >
      <LiquidGlass className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content-primary">Latest Posts</h2>
          <button className="text-accent-primary hover:text-opacity-80 transition-colors duration-200 text-sm font-medium">
            View All
          </button>
        </div>

        {/* Horizontal Scrolling Carousel */}
        <div className="relative">
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex-shrink-0 w-64"
              >
                <div className="group cursor-pointer">
                  {/* Image */}
                  <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300" />
                  </div>
                  
                  {/* Post Info */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-content-primary line-clamp-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-content-secondary">
                      <span>{post.author}</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-8 h-8 bg-background-primary rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors duration-200 shadow-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 w-8 h-8 bg-background-primary rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors duration-200 shadow-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </LiquidGlass>
    </motion.div>
  );
} 