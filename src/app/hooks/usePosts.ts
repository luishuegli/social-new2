'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  // Helper function to check if user liked a post
  const checkLikeStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', user.uid));
      return likeDoc.exists();
    } catch {
      return false;
    }
  }, [user?.uid]);

  // Helper function to enrich posts with like status
  const enrichPostsWithLikeStatus = useCallback(async (posts: Post[]): Promise<Post[]> => {
    if (!user?.uid) return posts;

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await checkLikeStatus(post.id);
        return { ...post, isLiked };
      })
    );
    return enrichedPosts;
  }, [user?.uid, checkLikeStatus]);

  useEffect(() => {
    setLoading(true);

    // If not authenticated, fetch from API (public feed)
    if (!user) {
      fetch('/api/posts?limit=20')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch posts');
          const json = await res.json();
          setPosts(json.posts || []);
          setLoading(false);
          setError(null);
        })
        .catch((error) => {
          console.error('Error fetching public posts:', error);
          setError('Failed to load posts');
          setPosts([]);
          setLoading(false);
        });
      return;
    }

    // Authenticated: Listen to Firestore directly for real-time updates
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));

      const unsub = onSnapshot(
        q,
        async (snap) => {
          const items: Post[] = [];
          snap.forEach((d) => {
            const data = d.data() as any;
            items.push({
              id: d.id,
              userName: data.authorName || data.authorId || 'User', // TODO: Fetch actual user profile
              userAvatar: data.authorAvatar || '',
              timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              content: data.content || data.description || data.activityTitle || '',
              imageUrl: data.imageUrl,
              media: data.media,
              likes: data.likes || 0,
              comments: data.comments || 0,
              isLiked: false, // Will be updated by enrich
              postType: data.postType || 'Individual',
              authenticityType: data.authenticityType,
              groupName: data.groupName,
              participants: data.participants,
              visibility: data.visibility
            });
          });

          if (items.length > 0) {
            const enriched = await enrichPostsWithLikeStatus(items);
            setPosts(enriched);
            setLoading(false);
          } else {
            setPosts([]);
            setLoading(false);
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
  }, [user, retryCount, enrichPostsWithLikeStatus]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
  }, []);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) {
      setError('Please sign in to like posts');
      return;
    }

    // Optimistic update
    const originalPost = posts.find(p => p.id === postId);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked,
          likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1)
        };
      }
      return post;
    }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/like-post', { // Note: Ensure this API exists or create it
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, isLiked })
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      // Success - no need to do anything as we optimistically updated
      // Real-time listener will eventually sync the true count
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert optimistic update on error
      if (originalPost) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return originalPost;
          }
          return post;
        }));
      }
      setError('Failed to like post. Please try again.');
    }
  }, [user, posts]);

  const handleComment = useCallback((postId: string, onOpenComments?: (post: Post) => void) => {
    const post = posts.find(p => p.id === postId);
    if (post && onOpenComments) {
      onOpenComments(post);
    }
  }, [posts]);

  return {
    posts,
    loading,
    error,
    retry,
    handleLike,
    handleComment
  };
}