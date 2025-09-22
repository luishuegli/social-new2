// src/components/PostCard.jsx
'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { usePosts } from '../app/hooks/usePosts';
import CommentModal from './ui/CommentModal';
import PostDetailModal from './ui/PostDetailModal';
import { getOptimalAspectRatio, getAspectRatioClasses } from '../app/utils/imageUtils';

export default function PostCard({ post /*: Post*/, onLike, onComment }) {
  const { handleLike: hookHandleLike, handleComment: hookHandleComment } = usePosts();
  const [showComments, setShowComments] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  
  if (!post) {
    return null;
  }

  const handleImageClick = () => {
    setShowPostDetail(true);
  };

  return (
    <>
      {/* 1. The Parent Container: This is the key.
      It has rounded corners and `overflow-hidden` to clip the image. */}
      <div className="rounded-2xl overflow-hidden shadow-lg flex flex-col bg-neutral-800">
        
        {/* 2. The Opaque Image Section */}
        {post.imageUrl && (
          <div onClick={handleImageClick} className="cursor-pointer">
            <ImageContainer src={post.imageUrl} alt={post.content || 'Post image'} fallbackSeed={post.id} />
          </div>
        )}

        {/* 3. The Denser Liquid Glass Text Section */}
        <div className="liquid-glass-dense p-4 flex flex-col flex-grow">
          {/* Author Info + Authenticity */}
          <div className="flex items-center mb-3 justify-between">
            <div className="flex items-center">
            {post.userAvatar && (
              <a href={post.username ? `/u/${post.username}` : '#'}>
                <NextImage
                  src={post.userAvatar}
                  alt={post.userName || 'User avatar'}
                  width={40}
                  height={40}
                  className="rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm" style={{ display: 'none' }}>
                  {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </a>
            )}
            {!post.userAvatar && (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm">
                {post.userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="ml-3">
              <a href={post.username ? `/u/${post.username}` : '#'} className="font-bold text-white hover:underline">
                {post.userName}
              </a>
              <p className="text-xs text-neutral-400">{post.timestamp}</p>
            </div>
            </div>
            {/* Authenticity label */}
            {post.authenticityType && (
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80 border border-white/15">
                {post.authenticityType}
              </span>
            )}
          </div>

          {/* Post Content */}
          <p className="text-neutral-200 mb-4 flex-grow line-clamp-3">
            {post.content}
          </p>

          {/* Action Bar */}
          <div className="flex items-center space-x-4 text-neutral-400 border-t border-white/10 pt-3 mt-auto">
          <button
            onClick={() => {
              if (onLike) {
                onLike(); // Use parent handler if provided (for backward compatibility)
              } else {
                hookHandleLike(post.id, !post.isLiked); // Use hook handler as default
              }
            }}
            className={`flex items-center space-x-1 hover:text-white transition-colors ${
              post.isLiked ? 'text-red-500' : 'text-neutral-400'
            }`}
            type="button"
          >
            <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
            <span>{post.likes}</span>
          </button>
          <button
            onClick={() => {
              if (onComment) {
                onComment(); // Use parent handler if provided
              } else {
                setShowComments(true); // Open comment modal
              }
            }}
            className="flex items-center space-x-1 hover:text-white transition-colors"
            type="button"
          >
            <MessageCircle size={18} />
            <span>{post.comments}</span>
          </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showComments && (
        <CommentModal
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          post={post}
          onLike={() => {
            if (onLike) {
              onLike();
            } else {
              hookHandleLike(post.id, !post.isLiked);
            }
          }}
        />
      )}

      {/* Post Detail Modal */}
      <PostDetailModal
        post={post}
        isOpen={showPostDetail}
        onClose={() => setShowPostDetail(false)}
      />
    </>
  );
}

function ImageContainer({ src, alt, fallbackSeed }) {
  const [error, setError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('aspect-[4/3]');
  const resolvedSrc = error ? `https://picsum.photos/seed/${fallbackSeed}/800/600` : src;

  useEffect(() => {
    // Only analyze aspect ratio if we have a valid image source
    if (!resolvedSrc) {
      setAspectRatio('aspect-[4/3]');
      return;
    }

    // Analyze the image to determine optimal aspect ratio
    const img = new window.Image();
    img.onload = () => {
      try {
        // Check if we have valid dimensions
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = getOptimalAspectRatio(img.naturalWidth, img.naturalHeight);
          setAspectRatio(getAspectRatioClasses(ratio));
        } else {
          setAspectRatio('aspect-[4/3]'); // Fallback for invalid dimensions
        }
      } catch (error) {
        console.warn('Error analyzing image aspect ratio:', error);
        setAspectRatio('aspect-[4/3]'); // Fallback on error
      }
    };
    img.onerror = () => {
      setAspectRatio('aspect-[4/3]'); // Fallback on load error
    };
    img.src = resolvedSrc;
  }, [resolvedSrc]);

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="w-full h-full object-cover block"
        onError={() => setError(true)}
      />
    </div>
  );
}