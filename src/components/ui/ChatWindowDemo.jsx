'use client';

import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

/**
 * Demo component to showcase the ChatWindow
 * This demonstrates how to use the ChatWindow component with sample data
 */
const ChatWindowDemo = () => {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      content: 'Hey everyone! How was the weekend?',
      sender: {
        id: 'user-1',
        name: 'Sarah Johnson',
        avatar: ''
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: 'msg-2',
      content: 'It was amazing! Went hiking and got some great photos.',
      sender: {
        id: 'user-2',
        name: 'Mike Chen',
        avatar: ''
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 minutes ago
    },
    {
      id: 'msg-3',
      content: 'That sounds incredible! Can\'t wait to see the photos.',
      sender: {
        id: 'current-user',
        name: 'You',
        avatar: ''
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 minutes ago
    },
    {
      id: 'msg-4',
      content: 'I\'ll share them in the group album later today!',
      sender: {
        id: 'user-2',
        name: 'Mike Chen',
        avatar: ''
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
    },
    {
      id: 'msg-5',
      content: 'Perfect! Looking forward to it.',
      sender: {
        id: 'current-user',
        name: 'You',
        avatar: ''
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
    }
  ]);

  const currentUser = {
    id: 'current-user',
    name: 'You',
    avatar: ''
  };

  const handleSendMessage = (messageContent) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      sender: currentUser,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    console.log('Message sent:', messageContent);
  };

  return (
    <div className="w-full">
      <ChatWindow
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatWindowDemo; 