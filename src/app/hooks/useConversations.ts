'use client';

import { useState, useEffect } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Conversation } from '../types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const chatsRef = collection(db, 'chats');
      // Chats where current user is a member
      const q = query(chatsRef, where('members', 'array-contains', user.uid));

      const unsub = onSnapshot(q, async (snapshot) => {
        const items: Conversation[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as any;
          const otherId = (data.members || []).find((id: string) => id !== user.uid);
          // Fetch last message
          const msgsRef = collection(db, 'chats', docSnap.id, 'messages');
          const lastQ = query(msgsRef, orderBy('timestamp', 'desc'), limit(1));
          const lastSnap = await getDocs(lastQ);
          const last = lastSnap.docs[0]?.data();

          // Fetch other user's profile for name and avatar
          let otherName = otherId || 'User';
          let otherAvatar = '';
          if (otherId) {
            try {
              const { getUserProfile } = await import('../services/dataService');
              const profile = await getUserProfile(otherId);
              if (profile) {
                otherName = profile.displayName || otherId;
                otherAvatar = profile.profilePictureUrl || '';
              }
            } catch {}
          }
          items.push({
            id: docSnap.id,
            otherUser: {
              id: otherId || 'unknown',
              name: otherName,
              avatar: otherAvatar
            },
            lastMessage: last ? {
              content: last.text,
              timestamp: last.timestamp?.toDate?.().toISOString?.() || new Date().toISOString(),
              senderId: last.senderId
            } : { content: '', timestamp: new Date().toISOString(), senderId: '' },
            unreadCount: 0
          });
        }

        items.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
        setConversations(items);
        setError(null);
        setLoading(false);
      }, (err) => {
        console.error('Conversations listener error:', err);
        setError('Failed to load conversations');
        setLoading(false);
      });

      return () => unsub();
    } catch (err) {
      console.error('Error setting up conversations listener:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  }, [user]);

  return {
    conversations,
    loading,
    error
  };
}