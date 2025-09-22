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
            // Enrich posts with like status for authenticated users
            enrichPostsWithLikeStatus(items).then((enrichedPosts) => {
              setPosts(enrichedPosts);
              setError(null);
              setLoading(false);
            });
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
                // Enrich API posts with like status too
                enrichPostsWithLikeStatus(mapped).then((enrichedPosts) => {
                  setPosts(enrichedPosts);
                  setError(null);
                  setLoading(false);
                });
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
  }, [user, retryCount]);

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
      const response = await fetch('/api/like-post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, isLiked })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to like post');
      }

      // Update with actual like count from server
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: result.isLiked,
            likes: result.newLikeCount
          };
        }
        return post;
      }));

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
    } else {
      console.log('Opening comments for post:', postId);
      // Fallback: could navigate to post detail page
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