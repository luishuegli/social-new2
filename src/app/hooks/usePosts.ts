'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockPosts } from '../utils/mockPosts';
import { Post } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sort by most recent timestamp and map to the Post interface
        const sortedPosts: Post[] = [...mockPosts].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).map(post => ({
          id: post.id,
          userName: post.author.name,
          userAvatar: post.author.avatar,
          timestamp: post.timestamp.toISOString(),
          content: post.caption,
          imageUrl: post.media[0]?.url,
          likes: post.likes,
          comments: post.comments,
          isLiked: post.isLiked,
        }));
        
        setPosts(sortedPosts);
        setError(null);
      } catch (err) {
        setError('Failed to load posts');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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