'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockRequests } from '../utils/mockRequests';
import { Request } from '../types';

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sort by most recent timestamp
        const sortedRequests: Request[] = [...mockRequests].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setRequests(sortedRequests);
        setError(null);
      } catch (err) {
        setError('Failed to load requests');
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      console.log('Accepting request:', requestId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // In a real app, you would make an API call here
      // await api.acceptRequest(requestId);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    }
  }, []);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    try {
      console.log('Declining request:', requestId);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // In a real app, you would make an API call here
      // await api.declineRequest(requestId);
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request');
    }
  }, []);

  return {
    requests,
    loading,
    error,
    handleAcceptRequest,
    handleDeclineRequest
  };
}