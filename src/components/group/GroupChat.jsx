'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import ChatPollCard from '../ui/ChatPollCard';
import ImagePollCard from '../ui/ImagePollCard';
import { useGroupMessages } from '../../app/hooks/useGroupMessages';
import { useActivityPolls } from '../../app/hooks/useActivityPolls';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../app/Lib/firebase';
import { useAuth } from '../../app/contexts/AuthContext';
import { markGroupAsRead } from '../../app/hooks/useUnreadSummary';

export default function GroupChat({ group }) {
  const { messages, loading, error, sendMessage } = useGroupMessages(group?.id);
  const { handleVote } = useActivityPolls();
  const [newMessage, setNewMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pollCache, setPollCache] = useState(new Map());
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Function to fetch poll data dynamically
  const fetchPollData = async (pollId) => {
    if (pollCache.has(pollId)) {
      return pollCache.get(pollId);
    }

    try {
      console.log('🔍 Fetching poll data for:', pollId);
      const pollRef = doc(db, 'polls', pollId);
      const pollDoc = await getDoc(pollRef);
      
      if (pollDoc.exists()) {
        const pollData = { id: pollDoc.id, ...pollDoc.data() };
        console.log('✅ Poll data fetched:', pollData);
        
        // Cache the poll data
        setPollCache(prev => new Map(prev.set(pollId, pollData)));
        return pollData;
      } else {
        console.error('❌ Poll not found:', pollId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching poll:', error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Mark as read when entering the chat and when scrolled near bottom
  useEffect(() => {
    if (!user?.uid || !group?.id) return;
    markGroupAsRead(group.id, user.uid);
  }, [user?.uid, group?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !user?.uid || !group?.id) return;
    const onScrollMark = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
      if (isNearBottom) markGroupAsRead(group.id, user.uid);
    };
    container.addEventListener('scroll', onScrollMark);
    return () => container.removeEventListener('scroll', onScrollMark);
  }, [user?.uid, group?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      try {
        await sendMessage(newMessage, user.uid, user.displayName || 'You');
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handlePollVote = async (pollId, optionId, userId) => {
    try {
      console.log('🗳️ GroupChat handling poll vote:', { pollId, optionId, userId });
      await handleVote(pollId, optionId, userId);
      console.log('✅ Vote submitted successfully');
      
      // Refresh poll data after voting
      setPollCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(pollId);
        return newCache;
      });
    } catch (error) {
      console.error('❌ Error voting on poll:', error);
      throw error;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Dynamic Poll Component that fetches data
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

    // Use ImagePollCard for all poll types now
    return (
      <ImagePollCard 
        poll={pollData}
        onVote={handlePollVote}
      />
    );
  };

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
          <div className="text-center">
            <p className="text-white/70 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </LiquidGlass>
    );
  }

  return (
    <LiquidGlass className="flex flex-col p-6 h-[70vh]">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Chat</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/70">Active now</span>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-6 min-h-0 scrollbar-hide relative">
        {messages.map((message, index) => {
          const isOwn = user ? message.senderId === user.uid : false;
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <MessageAvatar senderId={message.senderId} senderName={message.senderName} />
                </div>

                {/* Message Content */}
                <div className={`${isOwn ? 'text-right' : 'text-left'}`}>
                  {/* Check if this is a poll message */}
                  {message.type === 'poll_message' && message.pollData ? (
                    <div className="space-y-2">
                      {/* Poll notification text */}
                      <div className={`inline-block p-3 rounded-lg ${
                        isOwn 
                          ? 'bg-[rgba(255,255,255,0.16)] text-white backdrop-blur-sm' 
                          : 'bg-[rgba(255,255,255,0.12)] text-white backdrop-blur-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      
                      {/* Poll card - ensure poll has the correct ID */}
                      <ChatPollCard 
                        poll={{
                          ...message.pollData,
                          id: message.pollId || message.pollData.id // Use pollId from message or fallback to pollData.id
                        }}
                        onVote={handlePollVote}
                      />
                    </div>
                  ) : (message.type === 'image_poll' || message.type === 'ai_suggestions' || message.type === 'manual_poll') && message.pollId ? (
                    <div className="space-y-2">
                      {/* Poll notification text */}
                      <div className={`inline-block p-3 rounded-lg ${
                        isOwn 
                          ? 'bg-[rgba(255,255,255,0.16)] text-white backdrop-blur-sm' 
                          : 'bg-[rgba(255,255,255,0.12)] text-white backdrop-blur-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      
                      {/* Dynamic Poll card that fetches data */}
                      <DynamicPollCard message={message} />
                    </div>
                  ) : (
                    <div className={`inline-block p-3 rounded-lg ${
                      isOwn 
                        ? 'bg-[rgba(255,255,255,0.16)] text-white backdrop-blur-sm' 
                        : 'bg-[rgba(255,255,255,0.12)] text-white backdrop-blur-sm'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  <div className={`mt-1 text-xs text-white/50 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 z-10"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className="pt-4 border-t border-white/10 flex-shrink-0"
      >
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-white/70 hover:text-white transition-colors duration-200"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg transition-all duration-200 ${
              newMessage.trim()
                ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                : 'text-white/30 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </LiquidGlass>
  );
}

function MessageAvatar({ senderId, senderName }) {
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!senderId) return;
        const userRef = doc(db, 'users', senderId);
        const snap = await getDoc(userRef);
        if (!cancelled) setAvatarUrl(snap.exists() ? (snap.data()?.profilePictureUrl || null) : null);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [senderId]);

  if (avatarUrl) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
        <Image src={avatarUrl} alt={senderName || 'User'} width={32} height={32} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-xs font-semibold text-white">{senderName?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
    </div>
  );
}
