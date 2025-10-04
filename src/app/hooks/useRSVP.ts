'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface RSVPOptions {
  activityId: string;
  groupId: string;
  action: 'join' | 'leave';
}

export interface RSVPResponse {
  success: boolean;
  message: string;
  activityId: string;
  participants: string[];
}

export function useRSVP() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleRSVP = useCallback(async (options: RSVPOptions): Promise<RSVPResponse | null> => {
    const { activityId, groupId, action } = options;

    if (!user) {
      setError('Please sign in to RSVP');
      return null;
    }

    if (loading.has(activityId)) {
      return null; // Prevent double clicks
    }

    setLoading(prev => new Set([...prev, activityId]));
    setError(null);

    try {
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId,
          groupId,
          userId: user.uid,
          action
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update RSVP');
      }

      console.log(`✅ RSVP ${action} successful for activity ${activityId}`);
      return result;

    } catch (error: any) {
      console.error('RSVP error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to update RSVP';
      if (error.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to RSVP';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please try again';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Activity not found';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(activityId);
        return newSet;
      });
    }
  }, [user]);

  const isLoading = useCallback((activityId: string) => {
    return loading.has(activityId);
  }, [loading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleRSVP,
    isLoading,
    error,
    clearError
  };
}





