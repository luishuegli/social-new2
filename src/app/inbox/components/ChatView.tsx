'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages';
import { InfiniteScrollTrigger } from '@/components/common/PaginationTrigger';
import { Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatViewProps {
  conversationId: string;
  conversation: any;
  currentUserId: string;
}

export default function ChatView({ conversationId, conversation, currentUserId }: ChatViewProps) {
  const { firebaseUser } = useAuth();
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    triggerRef
  } = usePaginatedMessages({
    conversationId,
    enableInfiniteScroll: true
  });
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get other participant info
  const otherParticipantId = conversation?.participants?.find((id: string) => id !== currentUserId);
  const otherParticipantInfo = otherParticipantId && conversation?.participantInfo
    ? conversation.participantInfo[otherParticipantId]
    : null;

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending || !firebaseUser) return;

    setSending(true);
    const textToSend = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          text: textToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setMessageText(textToSend); // Restore message text on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 px-6 py-4 flex-shrink-0">
        {otherParticipantInfo?.photoURL ? (
          <img
            src={otherParticipantInfo.photoURL}
            alt={otherParticipantInfo.username}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-content-primary">
            {otherParticipantInfo?.username || 'User'}
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {/* Infinite scroll trigger for loading older messages */}
        <InfiniteScrollTrigger
          triggerRef={triggerRef}
          loading={loading}
          hasMore={hasMore}
        />

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No messages yet. Say hello! 👋
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUserId;
              const showTimestamp = index === 0 || 
                (messages[index - 1] && 
                 message.timestamp && 
                 messages[index - 1].timestamp &&
                 message.timestamp.toDate().getTime() - messages[index - 1].timestamp.toDate().getTime() > 300000); // 5 minutes

              return (
                <div key={message.id} className="space-y-2">
                  {/* Timestamp divider */}
                  {showTimestamp && message.timestamp && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`
                        max-w-[70%] px-4 py-3 rounded-2xl
                        ${isOwnMessage
                          ? 'bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-br-sm'
                          : 'liquid-glass text-content-primary border border-gray-200/20 dark:border-gray-700/20 rounded-bl-sm'
                        }
                      `}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 liquid-glass border-t border-gray-200/30 dark:border-gray-700/30">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherParticipantInfo?.username || 'User'}...`}
              className="w-full px-4 py-3 rounded-xl liquid-glass text-content-primary border border-gray-200/30 dark:border-gray-700/30 resize-none focus:border-accent-primary/50 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className={`
              p-3 rounded-xl font-semibold transition-all flex items-center justify-center
              ${messageText.trim() && !sending
                ? 'bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 hover:opacity-90 shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

