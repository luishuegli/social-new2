'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Lib/firebase';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  type?: string;
  pollId?: string;
  metadata?: any;
}

export function useGroupMessages(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    console.log('📨 Setting up group messages listener for:', groupId);
    
    try {
      // Create query to get messages for this group
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('🔥 Group messages snapshot received, docs:', snapshot.docs.length);
          
          const messagesData: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messagesData.push({
              id: doc.id,
              ...data
            } as Message);
          });

          // Reverse to show newest messages at bottom
          const reversedMessages = messagesData.reverse();
          console.log('📊 Group messages loaded:', reversedMessages);
          setMessages(reversedMessages);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.warn('Group messages listener permission error:', (err as any)?.message || err);
          setMessages([]);
          setError('');
          setLoading(false);
        }
      );

      return () => {
        console.log('🧹 Cleaning up group messages listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up group messages listener:', err);
      setError('Failed to connect to messages');
      setLoading(false);
    }
  }, [groupId]);

  const sendMessage = async (content: string, senderId: string, senderName: string) => {
    try {
      console.log('📤 Sending message to group:', { groupId, content, senderId, senderName });
      
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const messageData = {
        content,
        senderId,
        senderName,
        timestamp: serverTimestamp(),
        type: 'user_message'
      };

      await addDoc(messagesRef, messageData);
      console.log('✅ Message sent successfully');
    } catch (err) {
      console.error('❌ Error sending message:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
