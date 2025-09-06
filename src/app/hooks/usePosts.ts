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
    // Fetch posts for all users (authenticated and non-authenticated)
    // This ensures the home feed is always populated
    setLoading(true);
    
    if (!user) {
      // For non-authenticated users, fetch public posts via API
      fetch('/api/posts?limit=20')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch posts');
          const json = await res.json();
          setPosts(json.posts || []);
          setLoading(false);
          setError(null);
        })
        .catch((error) => {
          setError('Failed to load posts');
          setPosts([]);
          setLoading(false);
        });
      return;
    }

    setLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      let didHydrateFromApi = false;
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items: Post[] = [];
          snap.forEach((d) => {
            const data = d.data() as Record<string, unknown>;
            items.push({
              id: d.id,
              userName: (data.authorName as string) || (data.authorId as string) || 'User',
              userAvatar: (data.authorAvatar as string) || '',
              timestamp: (data as any).timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              content: (data.description as string) || (data.activityTitle as string) || '',
              imageUrl: Array.isArray((data as any).media) ? ((data as any).media?.[0]?.url as string | undefined) : (data.imageUrl as string | undefined),
              likes: (data.likes as number) || 0,
              comments: (data.comments as number) || 0,
              isLiked: false,
              // extra fields plumbed for feed logic (not in Post type)
              postType: (data.postType as 'Collaborative' | 'Individual' | undefined) || 'Individual',
              authenticityType: (data.authenticityType as 'Live Post' | 'Later Post' | undefined) || undefined,
              groupName: (data.groupName as string | undefined),
              participants: (data.participants as Array<{name?: string; avatarUrl?: string}> | undefined),
            });
          });
          if (items.length > 0) {
            setPosts(items);
            setError(null);
            setLoading(false);
          } else if (!didHydrateFromApi) {
            // Fallback: hydrate from server (admin) API
            fetch('/api/posts?limit=20')
              .then(async (res) => {
                if (!res.ok) throw new Error('posts api failed');
                const json = await res.json();
                const mapped: Post[] = (json.posts || []).map((data: any) => ({
                  id: data.id,
                  userName: data.userName || data.authorName || data.authorId || 'User',
                  userAvatar: data.userAvatar || '',
                  timestamp: data.timestamp || new Date().toISOString(),
                  content: data.content || data.description || data.activityTitle || '',
                  imageUrl: data.imageUrl || data.media?.[0]?.url,
                  likes: data.likes || 0,
                  comments: data.comments || 0,
                  isLiked: false,
                  postType: data.postType || 'Individual',
                  authenticityType: data.authenticityType,
                  groupName: data.groupName,
                  participants: data.participants,
                }));
                didHydrateFromApi = true;
                setPosts(mapped);
                setError(null);
                setLoading(false);
              })
              .catch(() => {
                setPosts([]);
                setLoading(false);
              });
          }
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