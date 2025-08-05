'use client';

import React from 'react';
import AppLayout from '../components/AppLayout';

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="w-full max-w-6xl mx-auto min-w-0">
        {/* Header */}
        <div className="liquid-glass p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 min-w-0">
          <h1 className="text-heading-1 font-bold text-content-primary mb-2 sm:mb-3">
            Calendar
          </h1>
          <p className="text-content-secondary text-body">
            Manage your schedule and stay organized with your events.
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="liquid-glass p-4 sm:p-6 lg:p-8 min-w-0">
          <h2 className="text-heading-2 font-semibold text-content-primary mb-4">My Calendar</h2>
          <p className="text-content-secondary">Calendar content will be implemented here.</p>
        </div>
      </div>
    </AppLayout>
  );
} 