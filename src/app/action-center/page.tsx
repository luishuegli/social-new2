'use client';

import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import ConversationListItem from '../../components/ConversationListItem';
import RequestCard from '../../components/RequestCard';
import ActivityPollCard from '../../components/ActivityPollCard';
import { useConversations } from '../hooks/useConversations';
import { useRequests } from '../hooks/useRequests';
import { useActivityPolls } from '../hooks/useActivityPolls';

export default function ActionCenterPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const { conversations, loading: conversationsLoading, error: conversationsError } = useConversations();
  const { 
    requests, 
    loading: requestsLoading, 
    error: requestsError, 
    handleAcceptRequest, 
    handleDeclineRequest 
  } = useRequests();
  const {
    polls,
    loading: pollsLoading,
    error: pollsError,
    handleVote
  } = useActivityPolls();

  const tabs = [
    { id: 'requests', label: 'Requests & Invites' },
    { id: 'messages', label: 'Messages' },
    { id: 'planning', label: 'Planning' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 min-w-0">
            <h2 className="text-heading-2 font-semibold text-content-primary mb-4">Requests & Invites</h2>
            
            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary-500 liquid-glass-square flex items-center justify-center"></div>
                <span className="ml-3 text-content-secondary">Loading requests...</span>
              </div>
            ) : requestsError ? (
              <div className="text-center py-12">
                <p className="text-content-secondary mb-4">{requestsError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-primary-500 text-white rounded-card hover:bg-primary-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 liquid-glass-square flex items-center justify-center">
                  <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-content-primary font-semibold mb-2">No requests yet</h3>
                <p className="text-content-secondary">You&apos;re all caught up! New requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 min-w-0">
            <h2 className="text-heading-2 font-semibold text-content-primary mb-4">Messages</h2>
            
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary-500 liquid-glass-square flex items-center justify-center"></div>
                <span className="ml-3 text-content-secondary">Loading conversations...</span>
              </div>
            ) : conversationsError ? (
              <div className="text-center py-12">
                <p className="text-content-secondary mb-4">{conversationsError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-primary-500 text-white rounded-card hover:bg-primary-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 liquid-glass-square flex items-center justify-center">
                  <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-content-primary font-semibold mb-2">No conversations yet</h3>
                <p className="text-content-secondary">Start a conversation with someone to see your messages here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <ConversationListItem 
                    key={conversation.id} 
                    conversation={conversation} 
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'planning':
        return (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 min-w-0">
            <h2 className="text-heading-2 font-semibold text-content-primary mb-4">Planning</h2>
            
            {pollsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary-500 liquid-glass-square flex items-center justify-center"></div>
                <span className="ml-3 text-content-secondary">Loading activity polls...</span>
              </div>
            ) : pollsError ? (
              <div className="text-center py-12">
                <p className="text-content-secondary mb-4">{pollsError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-primary-500 text-white rounded-card hover:bg-primary-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : polls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 liquid-glass-square flex items-center justify-center">
                  <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-content-primary font-semibold mb-2">No active polls</h3>
                <p className="text-content-secondary">You&apos;re all caught up! New activity polls from your groups will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {polls.map((poll) => (
                  <ActivityPollCard 
                    key={poll.id} 
                    poll={poll}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-6xl mx-auto min-w-0">
        {/* Page Header */}
        <div className="liquid-glass p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 min-w-0">
          <h1 className="text-heading-1 font-bold text-content-primary mb-2 sm:mb-3">
            Action Center
          </h1>
          <p className="text-content-secondary text-body">
            Manage your notifications, requests, and planning activities.
          </p>
        </div>

        {/* Tabbed Navigation - Now wrapped in LiquidGlass */}
        <div className="mb-6 sm:mb-8 min-w-0">
          <div className="liquid-glass p-4">
            <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg text-caption sm:text-body font-semibold transition-all duration-200 whitespace-nowrap
                    focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                    active:outline-none active:ring-0 active:border-0 active:shadow-none
                    ${activeTab === tab.id
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                    }
                  `}
                  style={{ outline: 'none' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px] min-w-0">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
} 