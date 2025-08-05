'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ChatWindow from '../../../components/ui/ChatWindow';

// Define types for messages and users
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate loading conversation data
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        content: 'Hey! How was your weekend?',
        sender: {
          id: 'user-1',
          name: 'Sarah Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'msg-2',
        content: 'It was amazing! Went hiking and got some great photos.',
        sender: {
          id: 'user-2',
          name: 'Mike Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: 'msg-3',
        content: 'That sounds incredible! Can\'t wait to see the photos.',
        sender: {
          id: 'current-user',
          name: 'You',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      },
      {
        id: 'msg-4',
        content: 'I\'ll share them in the group album later today!',
        sender: {
          id: 'user-2',
          name: 'Mike Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'msg-5',
        content: 'Perfect! Looking forward to it.',
        sender: {
          id: 'current-user',
          name: 'You',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ];

    const mockCurrentUser: User = {
      id: 'current-user',
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
    };

    setMessages(mockMessages);
    setCurrentUser(mockCurrentUser);
  }, [conversationId]);

  const handleSendMessage = (messageContent: string) => {
    if (!currentUser) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      sender: currentUser,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    console.log('Message sent:', messageContent);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen has-mesh-gradient">
        <div className="p-6">
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 min-w-0">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-accent-primary liquid-glass-square flex items-center justify-center"></div>
              <span className="ml-3 text-content-secondary">Loading conversation...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen has-mesh-gradient">
      {/* Back Button */}
      <div className="p-6">
        <Link 
          href="/action-center" 
          className="inline-flex items-center space-x-2 text-content-secondary hover:text-content-primary transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Conversations</span>
        </Link>
      </div>

      {/* Chat Container */}
      <div className="p-6">
        <div className="liquid-glass p-6">
          <ChatWindow
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
} 