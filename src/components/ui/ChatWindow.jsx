'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Send, Smile } from 'lucide-react';

/**
 * ChatWindow Component
 * A sleek, self-contained chat interface with liquid glass design
 * Styled to match the "Up Next" card design
 * 
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {Object} props.currentUser - Current user object
 * @param {Function} props.onSendMessage - Callback for sending messages
 */
const ChatWindow = ({ messages = [], currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[70vh] flex flex-col">
      {/* Header Section - Matching "Up Next" card style */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Group Chat</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-white/70">Active now</span>
        </div>
      </div>

      {/* Message Area - Scrollable */}
      <div className="flex-grow overflow-y-auto space-y-4 mb-6">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender?.id === currentUser?.id;
          
          return (
            <div
              key={message.id || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                    {message.sender?.avatar ? (
                      <Image
                        src={message.sender.avatar}
                        alt={message.sender.name || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className={`${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    isOwnMessage 
                      ? 'bg-[rgba(255,255,255,0.16)] text-white backdrop-blur-sm' 
                      : 'bg-[rgba(255,255,255,0.12)] text-white backdrop-blur-sm'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className={`mt-1 text-xs text-white/50 ${
                    isOwnMessage ? 'text-right' : 'text-left'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
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
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className={`p-2 rounded-lg transition-all duration-200 ${
            newMessage.trim()
              ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow; 