'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import PostImageModal from '../ui/PostImageModal';
import { db } from '@/app/Lib/firebase';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/app/contexts/AuthContext';

// Memoized post item to prevent unnecessary re-renders
const PostItem = React.memo(({ post, onLike, onShare, onImageClick, isLiking }) => {
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Image
            src={post.author.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.name}&backgroundColor=6366f1`}
            alt={post.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h4 className="font-semibold text-white">{post.author.name}</h4>
            <p className="text-sm text-white/60">{formatTimestamp(post.timestamp)}</p>
          </div>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Title */}
      {post.title && (
        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
      )}

      {/* Post Content */}
      {post.content && (
        <p className="text-white/80 mb-3 leading-relaxed">{post.content}</p>
      )}

      {/* Post Image */}
      {post.imageUrl && (
        <div 
          className="relative w-full h-64 mb-3 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => onImageClick(post)}
        >
          <Image
            src={post.imageUrl}
            alt={post.title || 'Post image'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onLike(post.id)}
            disabled={isLiking}
            className={`flex items-center space-x-2 transition-colors ${
              post.isLiked 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-white/60 hover:text-red-400'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>
          
          <button
            onClick={() => onShare(post)}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});

PostItem.displayName = 'PostItem';

export default function GroupPostsOptimized({ group }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingLikes, setLoadingLikes] = useState(new Set());

  // Memoized query to prevent unnecessary re-creation
  const postsQuery = useMemo(() => {
    if (!group?.id) return null;
    const postsRef = collection(db, 'posts');
    return query(postsRef, where('groupId', '==', group.id), orderBy('timestamp', 'desc'));
  }, [group?.id]);

  useEffect(() => {
    if (!postsQuery) {
      setPosts([]);
      return;
    }

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          title: data.title || data.activityTitle || 'Post',
          content: data.description || '',
          imageUrl: data.media?.[0]?.url || '',
          author: { 
            name: data.authorName || data.authorId || 'User', 
            avatarUrl: data.authorAvatar || '' 
          },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false, // Will be updated below
        });
      });

      // Check like status for authenticated users
      if (user?.uid && items.length > 0) {
        try {
          const postsWithLikeStatus = await Promise.all(
            items.map(async (post) => {
              try {
                const likeDoc = await getDoc(doc(db, 'posts', post.id, 'likes', user.uid));
                return { ...post, isLiked: likeDoc.exists() };
              } catch {
                return post;
              }
            })
          );
          setPosts(postsWithLikeStatus);
        } catch (error) {
          console.error('Error checking like status:', error);
          setPosts(items);
        }
      } else {
        setPosts(items);
      }
    });

    return unsubscribe;
  }, [postsQuery, user?.uid]);

  // Optimized like handler
  const handleLike = useCallback(async (postId) => {
    if (!user) {
      alert('Please sign in to like posts');
      return;
    }

    if (loadingLikes.has(postId)) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newIsLiked = !post.isLiked;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isLiked: newIsLiked, likes: newIsLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
        : p
    ));

    setLoadingLikes(prev => new Set([...prev, postId]));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/like-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, isLiked: newIsLiked })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to like post');
      }

      // Update with server response
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: result.isLiked, likes: result.newLikeCount }
          : p
      ));

    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: post.isLiked, likes: post.likes }
          : p
      ));
      alert('Failed to like post. Please try again.');
    } finally {
      setLoadingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }, [user, posts, loadingLikes]);

  // Optimized share handler
  const handleShare = useCallback(async (post) => {
    const shareData = {
      title: post.title,
      text: post.content,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch {
        alert('Unable to share or copy link');
      }
    }
  }, []);

  const handleImageClick = useCallback((post) => {
    const index = posts.findIndex(p => p.id === post.id);
    setActiveIndex(index);
  }, [posts]);

  const handleCloseModal = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  // Memoized post list
  const postList = useMemo(() => 
    posts.map((post) => (
      <PostItem
        key={post.id}
        post={post}
        onLike={handleLike}
        onShare={handleShare}
        onImageClick={handleImageClick}
        isLiking={loadingLikes.has(post.id)}
      />
    )), [posts, handleLike, handleShare, handleImageClick, loadingLikes]
  );

  if (posts.length === 0) {
    return (
      <LiquidGlass className="p-6 text-center">
        <div className="text-white/60">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Be the first to share something with the group!</p>
        </div>
      </LiquidGlass>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {postList}
      </div>

      {/* Image Modal */}
      {activeIndex >= 0 && (
        <PostImageModal
          posts={posts}
          initialIndex={activeIndex}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}






