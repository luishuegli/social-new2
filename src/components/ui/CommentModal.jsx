'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import LiquidGlass from './LiquidGlass';
import { useAuth } from '@/app/contexts/AuthContext';

export default function CommentModal({ 
  isOpen, 
  onClose, 
  post, 
  onLike 
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load comments when modal opens
  useEffect(() => {
    if (!isOpen || !post?.id) {
      setComments([]);
      setError(null);
      return;
    }

    setLoading(true);
    fetch(`/api/posts/${post.id}/comments`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load comments');
        const data = await res.json();
        setComments(data.comments || []);
      })
      .catch((err) => {
        console.error('Error loading comments:', err);
        setError('Failed to load comments');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, post?.id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: newComment.trim()
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to post comment');
      }

      // Add the new comment to the list
      const newCommentObj = {
        id: result.id,
        text: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'User',
        authorAvatar: user.photoURL || '',
        createdAt: new Date()
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');

    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <LiquidGlass className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Comments</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Post Preview */}
              {post && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-start space-x-3">
                    {post.userAvatar && (
                      <Image
                        src={post.userAvatar}
                        alt={post.userName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-white">{post.userName}</span>
                        <span className="text-xs text-white/60">{post.timestamp}</span>
                      </div>
                      <p className="text-white/90 text-sm">{post.content}</p>
                      
                      {/* Post Actions */}
                      <div className="flex items-center space-x-4 mt-3">
                        <button
                          onClick={() => onLike && onLike()}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            post.isLiked ? 'text-red-400' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={post.isLiked ? 'currentColor' : 'none'} />
                          <span>{post.likes}</span>
                        </button>
                        <div className="flex items-center space-x-1 text-sm text-white/60">
                          <MessageCircle className="w-4 h-4" />
                          <span>{comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-semibold">
                        {comment.authorAvatar ? (
                          <Image
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          comment.authorName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-sm">{comment.authorName}</span>
                          <span className="text-xs text-white/50">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-white/90 text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleSubmitComment} className="p-4 border-t border-white/10">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-semibold">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'You'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                        rows={2}
                        disabled={submitting}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/50">
                          {newComment.length}/2000
                        </span>
                        <button
                          type="submit"
                          disabled={!newComment.trim() || submitting}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors flex items-center space-x-2"
                        >
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>{submitting ? 'Posting...' : 'Post'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-white/10 text-center">
                  <p className="text-white/60">Please sign in to comment</p>
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
