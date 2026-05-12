'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import ChatView from '../components/ChatView';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
        
        if (!conversationDoc.exists()) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }

        const data = conversationDoc.data();
        setConversation({
          id: conversationDoc.id,
          ...data,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to view this conversation</h2>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-pulse">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-content-primary" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading conversation...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !conversation) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4 text-content-primary">{error || 'Conversation not found'}</h2>
          <button
            onClick={() => router.push('/inbox')}
            className="px-6 py-3 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Back to Inbox
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="liquid-glass border-b border-gray-200/30 dark:border-gray-700/30 px-4 py-3 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/inbox')}
              className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-content-primary" />
            </button>
            <div className="flex-1">
              <ChatView conversationId={conversationId} conversation={conversation} currentUserId={user.uid} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

