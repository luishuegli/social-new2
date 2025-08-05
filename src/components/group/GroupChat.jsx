'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function GroupChat({ group }) {
  const [newMessage, setNewMessage] = useState('');
  
  // Use group parameter to avoid ESLint warning
  if (!group) return null;
  
  // Mock chat messages - in real app, this would come from API
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Great photos from the sunset session! Can\'t wait for the next meetup.',
      author: {
        name: 'Sarah Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '2 hours ago',
      isOwn: false
    },
    {
      id: 'msg-2',
      content: 'Anyone up for a street photography walk this weekend?',
      author: {
        name: 'Mike Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '4 hours ago',
      isOwn: false
    },
    {
      id: 'msg-3',
      content: 'The new camera settings tutorial was really helpful. Thanks Emma!',
      author: {
        name: 'Alex Rodriguez',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '1 day ago',
      isOwn: false
    },
    {
      id: 'msg-4',
      content: 'I\'m definitely interested in the street photography walk!',
      author: {
        name: 'You',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: 'Just now',
      isOwn: true
    }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // TODO: Send message to API
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <LiquidGlass className="h-full flex flex-col p-6">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6"
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
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {mockMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                  {message.author.avatarUrl ? (
                    <Image
                      src={message.author.avatarUrl}
                      alt={message.author.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {message.author.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className={`${message.isOwn ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.isOwn 
                    ? 'bg-white/20 text-white backdrop-blur-sm' 
                    : 'bg-white/10 text-white backdrop-blur-sm'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className={`mt-1 text-xs text-white/50 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className="pt-4 border-t border-white/10"
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
          
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg transition-all duration-200 ${
              newMessage.trim()
                ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>
    </LiquidGlass>
  );
} 