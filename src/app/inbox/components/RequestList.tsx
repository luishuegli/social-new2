'use client';

import React from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { ConnectionRequest } from '@/app/hooks/useConnectionRequests';
import RequestCard from './RequestCard';
import { Users, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RequestListProps {
  requests: ConnectionRequest[];
  loading: boolean;
  currentUserId: string;
}

export default function RequestList({ requests, loading, currentUserId }: RequestListProps) {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const handleAccept = async (connectionId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message (you can add a toast notification here)
        console.log('Connection accepted:', data);
        
        // Navigate to the new conversation
        if (data.conversationId) {
          router.push(`/inbox/${data.conversationId}`);
        }
      } else {
        throw new Error(data.error || 'Failed to accept connection');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection request. Please try again.');
    }
  };

  const handleDecline = async (connectionId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId,
          action: 'decline',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Connection declined:', data);
      } else {
        throw new Error(data.error || 'Failed to decline connection');
      }
    } catch (error) {
      console.error('Error declining connection:', error);
      alert('Failed to decline connection request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-pulse">
            <Users className="w-16 h-16 mx-auto mb-4 text-content-primary" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-content-primary">No pending requests</h3>
          <p className="text-gray-600 dark:text-gray-400">
            When people want to connect with you, their requests will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-content-primary mb-2">Connection Requests</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to connect with you
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </div>
    </div>
  );
}

