'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { Mail, MessageCircle, Users } from 'lucide-react';
import RequestList from './components/RequestList';
import ConversationList from './components/ConversationList';
import { usePaginatedConnectionRequests } from '@/hooks/usePaginatedConnectionRequests';
import { InfiniteScrollTrigger } from '@/components/common/PaginationTrigger';
import { useConversations } from '../hooks/useConversations';

type InboxTab = 'chats' | 'requests';

export default function InboxPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<InboxTab>('chats');
  
  // Fetch data using hooks
  const {
    requests,
    loading: requestsLoading,
    hasMore: hasMoreRequests,
    triggerRef: requestsTriggerRef
  } = usePaginatedConnectionRequests({
    userId: user?.uid || '',
    enableInfiniteScroll: true
  });
  const { conversations, loading: conversationsLoading, totalUnread } = useConversations(user?.uid);

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to access your Inbox</h2>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-full">
        {/* Header */}
        <div className="liquid-glass sticky top-0 z-10 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-8 h-8 text-content-primary" />
                <h1 className="text-2xl font-bold text-content-primary">Inbox</h1>
              </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex justify-center">
              <div className="flex space-x-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-1.5 w-full max-w-md">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`
                    flex-1 px-8 py-4 rounded-lg text-body font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                    focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                    active:outline-none active:ring-0 active:border-0 active:shadow-none
                    ${activeTab === 'chats'
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                    }
                  `}
                  style={{ outline: 'none' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chats</span>
                  {totalUnread > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-accent-primary text-white">
                      {totalUnread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`
                    flex-1 px-8 py-4 rounded-lg text-body font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                    focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                    active:outline-none active:ring-0 active:border-0 active:shadow-none
                    ${activeTab === 'requests'
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                    }
                  `}
                  style={{ outline: 'none' }}
                >
                  <Users className="w-5 h-5" />
                  <span>Requests</span>
                  {requests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-accent-primary text-white">
                      {requests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-8">
          {activeTab === 'chats' ? (
            <ConversationList 
              conversations={conversations} 
              loading={conversationsLoading}
              currentUserId={user.uid}
            />
          ) : (
            <>
              <RequestList 
                requests={requests} 
                loading={requestsLoading}
                currentUserId={user.uid}
              />
              
              {/* Infinite scroll trigger for requests */}
              <InfiniteScrollTrigger
                triggerRef={requestsTriggerRef}
                loading={requestsLoading}
                hasMore={hasMoreRequests}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

