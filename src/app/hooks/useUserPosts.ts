'use client';

import { useEffect, useState } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Post } from '../types';

export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      return;
    }

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorId', '==', userId), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: Post[] = [];
      snap.forEach((d) => {
        const data: any = d.data();
        items.push({
          id: d.id,
          userName: data.authorName || data.authorId || 'User',
          userAvatar: data.authorAvatar || '',
          timestamp: data.timestamp?.toDate?.().toISOString?.() || new Date().toISOString(),
          content: data.description || data.activityTitle || '',
          imageUrl: data.media?.[0]?.url,
          likes: data.likes || 0,
          comments: data.comments || 0,
          isLiked: false,
        });
      });
      setPosts(items);
    });
    return () => unsub();
  }, [userId]);

  return { posts };
}

