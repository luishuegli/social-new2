'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Date;
  likes?: number;
  replies?: Comment[];
}

export interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export function useInstagramComments(postId: string) {
  const { user } = useAuth();
  const [commentState, setCommentState] = useState<CommentState>({
    comments: [],
    isLoading: false,
    isSubmitting: false,
    error: null
  });

  const loadComments = useCallback(async () => {
    if (!postId) return;

    setCommentState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load comments');
      }

      const comments = (result.comments || []).map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt?.toDate?.() || new Date(comment.createdAt)
      }));

      setCommentState(prev => ({
        ...prev,
        comments,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      setCommentState(prev => ({
        ...prev,
        error: error.message || 'Failed to load comments',
        isLoading: false
      }));
    }
  }, [postId]);

  const addComment = useCallback(async (text: string) => {
    if (!user || !text.trim() || commentState.isSubmitting) return;

    setCommentState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post comment');
      }

      // Add the new comment optimistically
      const newComment: Comment = {
        id: result.id,
        text: text.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'User',
        authorAvatar: user.profilePictureUrl || user.photoURL || '',
        createdAt: new Date()
      };

      setCommentState(prev => ({
        ...prev,
        comments: [...prev.comments, newComment],
        isSubmitting: false
      }));

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentState(prev => ({
        ...prev,
        error: error.message || 'Failed to post comment',
        isSubmitting: false
      }));
      throw error;
    }
  }, [user, postId, commentState.isSubmitting]);

  // Load comments when postId changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    commentState,
    addComment,
    loadComments
  };
}
