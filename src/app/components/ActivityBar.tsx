'use client';

import React, { useState } from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';

export default function ActivityBar() {
  const { activeActivity, leaveActivity } = useActivity();
  const { user } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeActivity) return null;

  const handleLeaveActivity = async () => {
    if (!user?.uid) {
      setError('Please sign in to leave activity');
      return;
    }

    setIsLeaving(true);
    setError(null);

    try {
      await leaveActivity(user.uid);
      // Success - the activity context will clear the active activity
    } catch (error) {
      console.error('Failed to leave activity:', error);
      setError(error instanceof Error ? error.message : 'Failed to leave activity');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur border-t border-border-separator lg:ml-64">
      <div className="text-content-primary font-semibold truncate">Activity Mode: {activeActivity.title}</div>
      
      <div className="flex items-center space-x-2">
        {error && (
          <span className="text-red-400 text-xs mr-2">{error}</span>
        )}
        <button
          onClick={handleLeaveActivity}
          disabled={isLeaving || !user?.uid}
          className="px-3 py-2 text-sm font-semibold rounded-card bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLeaving ? 'Leaving...' : 'Leave Activity'}
        </button>
      </div>
    </div>
  );
}

