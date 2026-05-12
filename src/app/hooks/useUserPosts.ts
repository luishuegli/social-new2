'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { Post } from '../types';
import { getUserProfile } from '../services/dataService';

export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      return;
    }

    const q = query(collection(db, 'posts'), where('userName', '==', userId), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const allPosts: Post[] = [];
      for (const doc of snap.docs) {
        const data = doc.data() as Post;
         // Note: Post interface uses userName instead of authorId
         allPosts.push({ ...data, id: doc.id });
      }
      setPosts(allPosts);
    });

    return unsub;
  }, [userId]);

  return { posts };
}

