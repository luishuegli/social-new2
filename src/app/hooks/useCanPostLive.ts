'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../Lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useCanPostLive(activityId?: string) {
  const { user } = useAuth();
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid || !activityId) {
      setCanPost(false);
      return;
    }

    const checkCanPost = async () => {
      setLoading(true);
      try {
        const activityDoc = await getDoc(doc(db, 'activities', activityId));
        
        if (!activityDoc.exists()) {
          setCanPost(false);
          return;
        }

        const data = activityDoc.data();
        const participants = Array.isArray(data.participants) ? data.participants : [];
        const left = Array.isArray(data.left) ? data.left : [];
        
        // User can post if:
        // 1. Activity is active
        // 2. User is in participants
        // 3. User is NOT in left list
        const isActive = data.status === 'active';
        const isParticipant = participants.includes(user.uid);
        const hasNotLeft = !left.includes(user.uid);
        
        setCanPost(isActive && isParticipant && hasNotLeft);
      } catch (error) {
        console.error('Error checking if user can post live:', error);
        setCanPost(false);
      } finally {
        setLoading(false);
      }
    };

    checkCanPost();
  }, [user?.uid, activityId]);

  return { canPost, loading };
}
