'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import PostImageModal from '../ui/PostImageModal';
import { db } from '@/app/Lib/firebase';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GroupPosts({ group }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingLikes, setLoadingLikes] = useState(new Set());
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    if (!group?.id) return;
    const q = query(postsRef, where('groupId', '==', group.id), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          title: data.title || data.activityTitle || 'Post',
          content: data.description || '',
          imageUrl: data.media?.[0]?.url || '',
          author: { name: data.authorName || data.authorId || 'User', avatarUrl: data.authorAvatar || '' },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false, // Will be updated below
        });
      });

      // Check like status for authenticated users
      if (user?.uid && items.length > 0) {
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
      } else {
        setPosts(items);
      }
    });
    return () => unsub();
  }, [group?.id, user?.uid]);

  const handleLike = async (postId) => {
    if (!user) {
      alert('Please sign in to like posts');
      return;
    }

    if (loadingLikes.has(postId)) return; // Prevent double clicks

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
  };

  const handleComment = (postId) => {
    // For now, just log - this could open a comment modal in the future
    console.log('Opening comments for post:', postId);
    // TODO: Implement comment modal or navigate to post detail page
  };

  const handleShare = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  if (!group) return null;

  return (
    <>
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
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="overflow-hidden bg-white/10 backdrop-blur-sm rounded-lg">
                {/* Post Image */}
                <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setActiveIndex(index)}>
                  {(() => {
                    const imageSrc = (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0)
                      ? post.imageUrl
                      : `https://picsum.photos/seed/${post.id}/800/400`;
                    return (
                      <Image
                        src={imageSrc}
                        alt={post.title || 'Post image'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    );
                  })()}
                </div>

                {/* Post Content */}
                <div className="p-4">
                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <a href={post.author.username ? `/u/${post.author.username}` : '#'} className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm block">
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
                      </a>
                      <div>
                        <a href={post.author.username ? `/u/${post.author.username}` : '#'} className="text-sm font-semibold text-white hover:underline">
                          {post.author.name}
                        </a>
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
                        disabled={loadingLikes.has(post.id)}
                        className={`flex items-center space-x-1 transition-colors duration-200 ${
                          post.isLiked 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-white/50 hover:text-white'
                        } ${loadingLikes.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Heart 
                          className="w-4 h-4" 
                          fill={post.isLiked ? 'currentColor' : 'none'}
                        />
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
    <PostImageModal
      isOpen={activeIndex >= 0}
      post={activeIndex >= 0 ? posts[activeIndex] : null}
      onClose={() => setActiveIndex(-1)}
      onPrev={activeIndex > 0 ? () => setActiveIndex((i) => Math.max(0, i - 1)) : undefined}
      onNext={activeIndex < posts.length - 1 ? () => setActiveIndex((i) => Math.min(posts.length - 1, i + 1)) : undefined}
    />
    </>
  );
} 