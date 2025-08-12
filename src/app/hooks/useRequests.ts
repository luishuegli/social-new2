'use client';

import { useState, useEffect } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

type RequestItem = {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  requester?: any;
  target?: any;
  timestamp?: any;
  status?: string;
};

export function useRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const reqRef = collection(db, 'requests');
      const q = query(reqRef, where('targetUserId', '==', user.uid));
      const unsub = onSnapshot(q, (snap) => {
        const items: RequestItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setRequests(items);
        setError(null);
        setLoading(false);
      }, (err) => {
        console.error('Requests listener error:', err);
        setError('Failed to load requests');
        setLoading(false);
      });
      return () => unsub();
    } catch (err) {
      console.error('Error setting up requests listener:', err);
      setError('Failed to load requests');
      setLoading(false);
    }
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    // For now, just remove from UI. You can update Firestore status here as needed.
    setRequests(prev => prev.filter(req => (req as any).id !== requestId));
  };

  const handleDeclineRequest = async (requestId: string) => {
    setRequests(prev => prev.filter(req => (req as any).id !== requestId));
  };

  return {
    requests,
    loading,
    error,
    handleAcceptRequest,
    handleDeclineRequest
  };
}
