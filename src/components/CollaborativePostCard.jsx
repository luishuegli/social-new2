'use client';

import React from 'react';
import Image from 'next/image';

export default function CollaborativePostCard({ post }) {
  if (!post) return null;

  const participants = Array.isArray(post.participants)
    ? post.participants.slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-accent-primary/20 to-transparent border border-accent-primary/30">
      {/* Header with group name and subtitle */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
        <div>
          <div className="text-sm text-white/70">{post.groupName || 'Group'}</div>
          <div className="text-white text-base font-semibold">shared a {post.authenticityType || 'Live Post'}</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/40">Featured</span>
      </div>

      {/* Media */}
      {post.imageUrl && (
        <div className="relative w-full aspect-[16/9]">
          <Image src={post.imageUrl} alt={post.content || 'Post image'} fill className="object-cover" />
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        {post.content && (
          <p className="text-white/90 mb-4">{post.content}</p>
        )}
        {/* Stacked avatars */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {participants.map((m, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-black/40">
                {m?.avatarUrl ? (
                  <Image src={m.avatarUrl} alt={m.name || 'Member'} width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-xs">
                    {(m?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {participants.length > 0 && (
            <span className="ml-3 text-xs text-white/70">{participants.length} participated</span>
          )}
        </div>
      </div>
    </div>
  );
}

