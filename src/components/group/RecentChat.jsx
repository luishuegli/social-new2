'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function RecentChat({ group }) {
  // Use group parameter to avoid ESLint warning
  if (!group) return null;
  // Mock data for recent messages - in real app, this would come from API
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Great photos from the sunset session! Can\'t wait for the next meetup.',
      author: {
        name: 'Sarah Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '2 hours ago'
    },
    {
      id: 'msg-2',
      content: 'Anyone up for a street photography walk this weekend?',
      author: {
        name: 'Mike Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '4 hours ago'
    },
    {
      id: 'msg-3',
      content: 'The new camera settings tutorial was really helpful. Thanks Emma!',
      author: {
        name: 'Alex Rodriguez',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      timestamp: '1 day ago'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
    >
      <LiquidGlass className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-content-primary">Recent Chat</h2>
          <div className="flex items-center space-x-2 text-content-secondary">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Active now</span>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="space-y-3 mb-4">
          {mockMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary">
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
                      <span className="text-xs font-semibold text-content-primary">
                        {message.author.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-content-primary">
                    {message.author.name}
                  </span>
                  <span className="text-xs text-content-secondary">
                    {message.timestamp}
                  </span>
                </div>
                <p className="text-sm text-content-secondary line-clamp-2">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Open Full Chat Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-accent-primary text-content-primary rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200"
        >
          <span>Open Full Chat</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </LiquidGlass>
    </motion.div>
  );
} 