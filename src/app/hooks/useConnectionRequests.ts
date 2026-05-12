// src/app/hooks/useConnectionRequests.ts
import { useState, useEffect } from 'react';
import { db } from '../Lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';

export interface ConnectionRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  requesterInfo?: {
    username: string;
    photoURL?: string;
    displayName?: string;
  };
}

export function useConnectionRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query for pending connection requests where current user is the recipient
    const q = query(
      collection(db, 'connections'),
      where('to', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const requestsData: ConnectionRequest[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Fetch requester info
          let requesterInfo = undefined;
          if (data.from) {
            try {
              const userDocRef = doc(db, 'users', data.from);
              const userDoc = await getDoc(userDocRef);
              const userData = userDoc.data();
              if (userData) {
                requesterInfo = {
                  username: userData.username || userData.displayName || 'User',
                  photoURL: userData.photoURL,
                  displayName: userData.displayName,
                };
              }
            } catch (err) {
              console.error('Error fetching requester info:', err);
            }
          }
          
          requestsData.push({
            id: docSnapshot.id,
            from: data.from,
            to: data.to,
            status: data.status,
            message: data.message,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            requesterInfo,
          });
        }
        
        setRequests(requestsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching connection requests:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { requests, loading, error, count: requests.length };
}

