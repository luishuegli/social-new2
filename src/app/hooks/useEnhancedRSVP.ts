'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnhancedActivity } from '../contexts/EnhancedActivityContext';

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

/**
 * Enhanced RSVP hook that integrates with activity context
 * Ensures real-time synchronization across all components
 */
export function useEnhancedRSVP() {
  const { user } = useAuth();
  const { updateActivityParticipants, getActivityById } = useEnhancedActivity();
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
      // Optimistic update - immediately update local state
      const currentActivity = getActivityById(activityId);
      if (currentActivity) {
        let optimisticParticipants = [...currentActivity.participants];
        
        if (action === 'join' && !optimisticParticipants.includes(user.uid)) {
          optimisticParticipants.push(user.uid);
        } else if (action === 'leave') {
          optimisticParticipants = optimisticParticipants.filter(id => id !== user.uid);
        }
        
        // Update context immediately for responsive UI
        updateActivityParticipants(activityId, optimisticParticipants);
      }

      // Make API call
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
        // Revert optimistic update on error
        if (currentActivity) {
          updateActivityParticipants(activityId, currentActivity.participants);
        }
        throw new Error(result.error || 'Failed to update RSVP');
      }

      // Update context with server response (this will be overridden by real-time listener)
      updateActivityParticipants(activityId, result.participants);

      console.log(`✅ RSVP ${action} successful for activity ${activityId}`);
      
      // Broadcast RSVP event for other components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rsvp-updated', {
          detail: {
            activityId,
            groupId,
            action,
            userId: user.uid,
            participants: result.participants
          }
        }));
      }

      return result;

    } catch (error: any) {
      console.error('RSVP error:', error);
      
      // Revert optimistic update on error
      const currentActivity = getActivityById(activityId);
      if (currentActivity) {
        updateActivityParticipants(activityId, currentActivity.participants);
      }
      
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
  }, [user, updateActivityParticipants, getActivityById]);

  const isLoading = useCallback((activityId: string) => {
    return loading.has(activityId);
  }, [loading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Batch RSVP for multiple activities
  const handleBatchRSVP = useCallback(async (
    activities: Array<{ activityId: string; groupId: string; action: 'join' | 'leave' }>
  ): Promise<RSVPResponse[]> => {
    const results = await Promise.allSettled(
      activities.map(activity => handleRSVP(activity))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<RSVPResponse> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }, [handleRSVP]);

  // Check if user has RSVP'd to an activity
  const hasRSVPd = useCallback((activityId: string): boolean => {
    if (!user) return false;
    const activity = getActivityById(activityId);
    return activity ? activity.participants.includes(user.uid) : false;
  }, [user, getActivityById]);

  // Get RSVP status for multiple activities
  const getRSVPStatuses = useCallback((activityIds: string[]): Record<string, boolean> => {
    const statuses: Record<string, boolean> = {};
    activityIds.forEach(id => {
      statuses[id] = hasRSVPd(id);
    });
    return statuses;
  }, [hasRSVPd]);

  return {
    handleRSVP,
    handleBatchRSVP,
    isLoading,
    error,
    clearError,
    hasRSVPd,
    getRSVPStatuses
  };
}
