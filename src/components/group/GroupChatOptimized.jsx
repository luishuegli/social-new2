'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import ImagePollCard from '../ui/ImagePollCard';
import { useGroupMessages } from '../../app/hooks/useGroupMessages';
import { useActivityPolls } from '../../app/hooks/useActivityPolls';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../app/Lib/firebase';
import { useAuth } from '../../app/contexts/AuthContext';
import { markGroupAsRead } from '../../app/hooks/useUnreadSummary';

// Memoized poll cache hook for better performance
const usePollCache = () => {
  const [cache, setCache] = useState(new Map());
  
  const fetchPollData = useCallback(async (pollId) => {
    if (cache.has(pollId)) {
      return cache.get(pollId);
    }

    try {
      const pollRef = doc(db, 'polls', pollId);
      const pollDoc = await getDoc(pollRef);
      
      if (pollDoc.exists()) {
        const pollData = { id: pollDoc.id, ...pollDoc.data() };
        setCache(prev => new Map(prev.set(pollId, pollData)));
        return pollData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching poll:', error);
      return null;
    }
  }, [cache]);

  return { fetchPollData };
};

// Memoized message component to prevent unnecessary re-renders
const MessageItem = React.memo(({ message, onPollVote, fetchPollData }) => {
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  // Dynamic Poll Component
  const DynamicPollCard = ({ message }) => {
    const [pollData, setPollData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadPollData = async () => {
        if (message.pollId) {
          const data = await fetchPollData(message.pollId);
          setPollData(data);
        }
        setLoading(false);
      };
      loadPollData();
    }, [message.pollId]);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-4 bg-white/10 rounded-lg">
          <div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div>
          <span className="ml-2 text-white/70">Loading poll...</span>
        </div>
      );
    }

    if (!pollData) {
      return (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">⚠️ Poll data could not be loaded</p>
        </div>
      );
    }

    return <ImagePollCard poll={pollData} onVote={onPollVote} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex space-x-3 mb-4"
    >
      <div className="flex-shrink-0">
        <Image
          src={message.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.authorName}&backgroundColor=6366f1`}
          alt={message.authorName}
          width={40}
          height={40}
          className="rounded-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <h4 className="text-sm font-semibold text-white truncate">
            {message.authorName}
          </h4>
          <span className="text-xs text-white/50">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        {message.type === 'poll' ? (
          <div className="mt-2">
            <DynamicPollCard message={message} />
          </div>
        ) : (
          <p className="mt-1 text-sm text-white/80 leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';

export default function GroupChatOptimized({ group }) {
  const { messages, loading, error, sendMessage } = useGroupMessages(group?.id);
  const { handleVote } = useActivityPolls();
  const { fetchPollData } = usePollCache();
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Optimized scroll functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Optimized poll vote handler
  const handlePollVote = useCallback(async (pollId, optionId, userId) => {
    try {
      await handleVote(pollId, optionId, userId);
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  }, [handleVote]);

  // Optimized message send handler
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !user) return;

    try {
      await sendMessage(trimmedMessage, user.uid, user.displayName || 'User');
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, user, sendMessage, scrollToBottom]);

  // Mark group as read when messages change
  useEffect(() => {
    if (messages.length > 0 && user?.uid && group?.id) {
      markGroupAsRead(group.id, user.uid);
    }
  }, [messages.length, user?.uid, group?.id]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Memoized message list to prevent unnecessary re-renders
  const messageList = useMemo(() => 
    messages.map((message) => (
      <MessageItem
        key={message.id}
        message={message}
        onPollVote={handlePollVote}
        fetchPollData={fetchPollData}
      />
    )), [messages, handlePollVote, fetchPollData]
  );

  if (loading) {
    return (
      <LiquidGlass className="flex flex-col p-6 h-[70vh]">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-b-2 border-white rounded-full"></div>
          <span className="ml-3 text-white/70">Loading messages...</span>
        </div>
      </LiquidGlass>
    );
  }

  if (error) {
    return (
      <LiquidGlass className="flex flex-col p-6 h-[70vh]">
        <div className="flex items-center justify-center h-full">
          <p className="text-red-200">Error loading messages: {error}</p>
        </div>
      </LiquidGlass>
    );
  }

  return (
    <LiquidGlass className="flex flex-col p-6 h-[70vh]">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        style={{ maxHeight: 'calc(70vh - 140px)' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/50 text-center">
              No messages yet.<br />
              <span className="text-sm">Start the conversation!</span>
            </p>
          </div>
        ) : (
          <>
            {messageList}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 bg-accent-primary hover:bg-accent-primary/80 text-white p-2 rounded-full shadow-lg transition-colors"
        >
          ↓
        </motion.button>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-transparent"
            maxLength={500}
          />
        </div>
        <button
          type="submit"
          disabled={!newMessage.trim() || !user}
          className="bg-accent-primary hover:bg-accent-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white p-3 rounded-full transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </LiquidGlass>
  );
}





