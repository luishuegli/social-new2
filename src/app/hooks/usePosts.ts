'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // If logged out, clear state and stop listening
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items: Post[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            items.push({
              id: d.id,
              userName: data.authorName || data.authorId || 'User',
              userAvatar: data.authorAvatar || '',
              timestamp: data.timestamp?.toDate?.().toISOString?.() || new Date().toISOString(),
              content: data.description || data.activityTitle || '',
              imageUrl: data.media?.[0]?.url,
              likes: data.likes || 0,
              comments: data.comments || 0,
              isLiked: false,
            });
          });
          setPosts(items);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Posts listener error:', err);
          setError('Failed to load posts');
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error('Error setting up posts listener:', err);
      setError('Failed to load posts');
      setLoading(false);
    }
  }, [user]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    try {
      console.log('Liking post:', postId, isLiked);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update the post in local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      }));
      
      // In a real app, you would make an API call here
      // await api.likePost(postId, isLiked);
    } catch (err) {
      console.error('Error liking post:', err);
      throw err; // Re-throw so component can handle revert
    }
  }, []);

  const handleComment = useCallback(async (postId: string) => {
    try {
      console.log('Opening comments for post:', postId);
      // In a real app, this might open a comments modal or navigate to post detail
      // For now, just log the action
    } catch (err) {
      console.error('Error opening comments:', err);
    }
  }, []);

  return {
    posts,
    loading,
    error,
    handleLike,
    handleComment
  };
}