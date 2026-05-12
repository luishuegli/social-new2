'use client';

import React from 'react';
import Link from 'next/link';
import { Conversation } from '@/app/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
}

export default function ConversationListItem({ conversation, currentUserId }: ConversationListItemProps) {
  // Get the other participant's info
  const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
  const otherParticipantInfo = otherParticipantId 
    ? conversation.participantInfo[otherParticipantId]
    : null;

  // Get unread count for current user
  const unreadCount = conversation.unreadCount[currentUserId] || 0;
  const hasUnread = unreadCount > 0;

  // Format timestamp
  const timeAgo = conversation.lastMessage?.timestamp
    ? formatDistanceToNow(conversation.lastMessage.timestamp.toDate(), { addSuffix: true })
    : '';

  // Determine if last message was sent by current user
  const isOwnMessage = conversation.lastMessage?.senderId === currentUserId;

  return (
    <Link href={`/inbox/${conversation.id}`}>
      <div className={`
        liquid-glass rounded-xl p-4 border transition-all cursor-pointer hover:scale-[1.01]
        ${hasUnread
          ? 'border-accent-primary/50 bg-accent-primary/5'
          : 'border-gray-200/20 dark:border-gray-700/20'
        }
      `}>
        <div className="flex items-center space-x-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0 relative">
            {otherParticipantInfo?.photoURL ? (
              <img
                src={otherParticipantInfo.photoURL}
                alt={otherParticipantInfo.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`text-base font-bold truncate ${
                hasUnread ? 'text-content-primary' : 'text-content-primary'
              }`}>
                {otherParticipantInfo?.username || 'User'}
              </h3>
              {timeAgo && (
                <span className={`text-xs ml-2 flex-shrink-0 ${
                  hasUnread 
                    ? 'text-accent-primary font-semibold' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {timeAgo}
                </span>
              )}
            </div>

            {/* Last Message */}
            {conversation.lastMessage && (
              <p className={`text-sm truncate ${
                hasUnread 
                  ? 'text-content-primary font-medium' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isOwnMessage && 'You: '}
                {conversation.lastMessage.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

