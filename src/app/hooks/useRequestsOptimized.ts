'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface RequestItem {
  id: string;
  type: 'friend_request' | 'group_invitation' | 'activity_invitation';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  targetUserId: string;
  groupId?: string;
  groupName?: string;
  activityId?: string;
  activityTitle?: string;
  message?: string;
  timestamp: Date;
  status?: 'pending' | 'accepted' | 'declined';
}

export function useRequestsOptimized() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized query to prevent unnecessary re-creation
  const requestQuery = useMemo(() => {
    if (!user?.uid) return null;
    const reqRef = collection(db, 'requests');
    return query(reqRef, where('targetUserId', '==', user.uid), where('status', '==', 'pending'));
  }, [user?.uid]);

  useEffect(() => {
    if (!requestQuery) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      requestQuery,
      (snapshot) => {
        const items: RequestItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            type: data.type || 'friend_request',
            fromUserId: data.fromUserId || '',
            fromUserName: data.fromUserName || 'Unknown User',
            fromUserAvatar: data.fromUserAvatar,
            targetUserId: data.targetUserId || '',
            groupId: data.groupId,
            groupName: data.groupName,
            activityId: data.activityId,
            activityTitle: data.activityTitle,
            message: data.message,
            timestamp: data.timestamp?.toDate() || new Date(),
            status: data.status || 'pending',
          });
        });
        
        // Sort by timestamp (newest first)
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setRequests(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Requests listener error:', err);
        setError('Failed to load requests');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [requestQuery]);

  // Optimized request handlers with proper error handling
  const handleAcceptRequest = useCallback(async (requestId: string) => {
    if (!requestId) return false;

    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
      });

      // Optimistically update UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
      return true;
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept request');
      return false;
    }
  }, []);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    if (!requestId) return false;

    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        status: 'declined',
        declinedAt: new Date(),
      });

      // Optimistically update UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
      return true;
    } catch (error) {
      console.error('Error declining request:', error);
      setError('Failed to decline request');
      return false;
    }
  }, []);

  const handleDeleteRequest = useCallback(async (requestId: string) => {
    if (!requestId) return false;

    try {
      const requestRef = doc(db, 'requests', requestId);
      await deleteDoc(requestRef);

      // Optimistically update UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Failed to delete request');
      return false;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => setError(null), []);

  // Computed values
  const pendingCount = useMemo(() => 
    requests.filter(req => req.status === 'pending').length, 
    [requests]
  );

  const hasRequests = requests.length > 0;

  return {
    requests,
    loading,
    error,
    pendingCount,
    hasRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    handleDeleteRequest,
    clearError,
  };
}





