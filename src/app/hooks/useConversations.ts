// src/app/hooks/useConversations.ts
import { useState, useEffect } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

export interface Conversation {
  id: string;
  participants: string[];
  participantInfo: {
    [userId: string]: {
      username: string;
      photoURL?: string;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  } | null;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query for conversations where user is a participant
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationsData: Conversation[] = [];
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          
          conversationsData.push({
            id: doc.id,
            participants: data.participants || [],
            participantInfo: data.participantInfo || {},
            lastMessage: data.lastMessage || null,
            unreadCount: data.unreadCount || {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        
        setConversations(conversationsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching conversations:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (userId ? (conv.unreadCount[userId] || 0) : 0);
  }, 0);

  return { conversations, loading, error, totalUnread };
}
