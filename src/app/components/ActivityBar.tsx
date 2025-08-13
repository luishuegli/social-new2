'use client';

import React from 'react';
import { useActivity } from '../contexts/ActivityContext';

export default function ActivityBar() {
  const { activeActivity, endActivity } = useActivity();
  if (!activeActivity) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur border-t border-border-separator lg:ml-64">
      <div className="text-content-primary font-semibold truncate">Activity Mode: {activeActivity.title}</div>
      <button
        onClick={endActivity}
        className="px-3 py-2 text-sm font-semibold rounded-card bg-red-500 text-white hover:bg-red-600"
      >
        End Activity
      </button>
    </div>
  );
}

