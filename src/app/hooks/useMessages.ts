// src/app/hooks/useMessages.ts
import { useState, useEffect } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query for messages in this conversation
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: Message[] = [];
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          
          messagesData.push({
            id: doc.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp,
            read: data.read || false,
          });
        });
        
        setMessages(messagesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading, error };
}

