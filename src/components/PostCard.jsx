// src/components/PostCard.jsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';

// This is a placeholder type. Ensure it matches your actual Post type from src/app/types.ts
// interface Post {
//   id: string;
//   imageUrl?: string;
//   userAvatar: string;
//   userName: string;
//   timestamp: string;
//   content: string;
//   likes: number;
//   comments: number;
// }

export default function PostCard({ post /*: Post*/ }) {
  if (!post) {
    return null;
  }

  return (
    // 1. The Parent Container: This is the key.
    // It has rounded corners and `overflow-hidden` to clip the image.
    <div className="rounded-2xl overflow-hidden shadow-lg flex flex-col bg-neutral-800">
      
      {/* 2. The Opaque Image Section */}
      {post.imageUrl && (
        <ImageContainer src={post.imageUrl} alt={post.content || 'Post image'} fallbackSeed={post.id} />
      )}

      {/* 3. The Denser Liquid Glass Text Section */}
      <div className="liquid-glass-dense p-4 flex flex-col flex-grow">
        {/* Author Info + Authenticity */}
        <div className="flex items-center mb-3 justify-between">
          <div className="flex items-center">
          {post.userAvatar && (
                  <Image
                    src={post.userAvatar}
                    alt={post.userName || 'User avatar'}
                    width={40}
                    height={40}
              className="rounded-full"
            />
          )}
          <div className="ml-3">
            <p className="font-bold text-white">{post.userName}</p>
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
          <div className="flex items-center space-x-1">
            <Heart size={18} />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={18} />
            <span>{post.comments}</span>
            </div>
        </div>
      </div>
    </div>
  );
}

function ImageContainer({ src, alt, fallbackSeed }) {
  const [error, setError] = useState(false);
  const resolvedSrc = error ? `https://picsum.photos/seed/${fallbackSeed}/800/600` : src;
  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden">
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