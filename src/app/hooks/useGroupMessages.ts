'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/dataService';
import { UserProfile } from '../types/firestoreSchema';

export interface Message {
  id: string;
  senderId: string;
  sender?: UserProfile | null;
  content: string;
  timestamp: Date;
}

export function useGroupMessages(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!groupId) return;

    const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, async (snap) => {
      const allMessages: Message[] = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const sender = await getUserProfile(data.senderId);
        allMessages.push({
          id: doc.id,
          senderId: data.senderId,
          sender,
          content: data.content,
          timestamp: data.timestamp?.toDate(),
        });
      }
      setMessages(allMessages);
    });
    return unsub;
  }, [groupId]);

  const sendMessage = async (content: string) => {
    if (!user || !groupId) return;
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      senderId: user.uid,
      content,
      timestamp: serverTimestamp(),
    });
  };

  return { messages, sendMessage };
}
