'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import { db } from '@/app/Lib/firebase';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

export default function RecentChat({ group }) {
  if (!group) return null;
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const refCol = collection(db, 'groups', group.id, 'messages');
    const q = query(refCol, orderBy('timestamp', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          content: data.text || data.content || '',
          author: { name: data.senderName || data.senderId || 'User', avatarUrl: data.senderAvatar || '' },
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        });
      });
      setMessages(items.reverse());
    });
    return () => unsub();
  }, [group.id]);

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
          {messages.map((message, index) => (
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