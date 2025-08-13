'use client';

import React from 'react';
import AppLayout from '@/app/components/AppLayout';
import { useActivity } from '@/app/contexts/ActivityContext';

export default function LivePostCreatePage() {
  const { activeActivity } = useActivity();
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="liquid-glass p-6">
          <h1 className="text-heading-1 font-bold text-content-primary mb-2">Live Post</h1>
          {activeActivity ? (
            <>
              <p className="text-content-secondary mb-4">Activity: {activeActivity.title}</p>
              <div className="p-4 bg-black/40 rounded-card border border-border-separator text-content-secondary">
                Live Post camera interface will be implemented here.
              </div>
            </>
          ) : (
            <p className="text-content-secondary">No active activity. Start one in Activity Mode.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

