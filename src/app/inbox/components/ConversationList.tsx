'use client';

import React from 'react';
import { Conversation } from '@/app/hooks/useConversations';
import ConversationListItem from './ConversationListItem';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  currentUserId: string;
}

export default function ConversationList({ conversations, loading, currentUserId }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-pulse">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-content-primary" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-content-primary">No conversations yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start connecting with people to begin conversations. Accept connection requests or discover new people in the Connect tab.
          </p>
          <a 
            href="/compass" 
            className="inline-block px-6 py-3 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Discover People
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-content-primary mb-2">Your Conversations</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

