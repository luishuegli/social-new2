'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LiquidGlass from './ui/LiquidGlass';

export default function ConversationListItem({ conversation }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimestamp = (date) => {
    if (!mounted || !date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return messageDate.toLocaleDateString();
  };

  const truncateMessage = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <Link href={`/messages/${conversation.id}`} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <LiquidGlass className="p-4 mb-3">
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
                {conversation.otherUser.avatar ? (
                  <Image
                    src={conversation.otherUser.avatar}
                    alt={conversation.otherUser.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-content-primary">
                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {conversation.otherUser.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-support-success rounded-full border-2 border-background-primary"></div>
              )}
            </div>

            {/* Conversation Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-content-primary truncate">
                  {conversation.otherUser.name}
                </h3>
                <span className="text-xs text-content-secondary flex-shrink-0 ml-2">
                  {formatTimestamp(conversation.lastMessage.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-content-secondary truncate">
                  {conversation.lastMessage.senderId === 'currentUser' && 'You: '}
                  {truncateMessage(conversation.lastMessage.content)}
                </p>
                {conversation.unreadCount > 0 && (
                  <div className="ml-2 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-content-primary">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </LiquidGlass>
      </motion.div>
    </Link>
  );
}