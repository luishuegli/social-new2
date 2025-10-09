'use client';

import React, { useState } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { Plus, Zap } from 'lucide-react';
import SoloActivityModal from './SoloActivityModal';
import { useAuth } from '@/app/contexts/AuthContext';

interface Activity {
  id: string;
  title: string;
  date: string | Date;
  description?: string;
}

interface CalendarViewProps {
  activities: Activity[];
  onActivityCreated?: () => void;
}

const localizer = momentLocalizer(moment);

export default function CalendarView({ activities, onActivityCreated }: CalendarViewProps) {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const events: Event[] = activities.map(activity => ({
    title: activity.title,
    start: new Date(activity.date),
    end: new Date(activity.date), // Assuming activities are single-day events
    allDay: true,
    resource: activity,
  }));

  const handleCreateSoloActivity = async (activityData: Omit<Activity, 'id'>) => {
    if (!user) {
      alert('You must be logged in to create an activity.');
      return;
    }
    try {
      const response = await fetch('/api/activities/solo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...activityData, userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to create solo activity');
      }

      const newActivity = await response.json();
      console.log('Successfully created solo activity:', newActivity);
      
      setIsCreateModalOpen(false);
      
      // Notify parent component to refresh activities
      if (onActivityCreated) {
        onActivityCreated();
      }
    } catch (error) {
      console.error(error);
      alert('There was an error creating the activity.');
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedActivity(event.resource as Activity);
  };

  const closeDetailView = () => {
    setSelectedActivity(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 liquid-glass p-6">
        <div style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            onSelectEvent={handleSelectEvent}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Schedule Solo Activity Card */}
      <div className="liquid-glass p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-content-primary">Schedule Solo Activity</h3>
        </div>
        
        <p className="text-content-secondary mb-6">
          Create a personal activity and add it to your calendar. You can create live posts from solo activities too!
        </p>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-secondary transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Solo Activity</span>
        </button>

        {/* Quick Tips */}
        <div className="mt-6 pt-6 border-t border-border-separator">
          <h4 className="text-sm font-semibold text-content-primary mb-3">Quick Tips</h4>
          <ul className="space-y-2 text-sm text-content-secondary">
            <li className="flex items-start space-x-2">
              <Zap className="w-4 h-4 mt-0.5 text-accent-primary flex-shrink-0" />
              <span>Solo activities appear only on your calendar</span>
            </li>
            <li className="flex items-start space-x-2">
              <Zap className="w-4 h-4 mt-0.5 text-accent-primary flex-shrink-0" />
              <span>Create live posts when you&apos;re doing the activity</span>
            </li>
            <li className="flex items-start space-x-2">
              <Zap className="w-4 h-4 mt-0.5 text-accent-primary flex-shrink-0" />
              <span>Click any event to view details</span>
            </li>
          </ul>
        </div>
      </div>

      <SoloActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSoloActivity}
      />

      {/* Activity Detail View */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="liquid-glass p-6 rounded-lg shadow-xl w-full max-w-md m-4">
            <h2 className="text-2xl font-bold text-content-primary mb-2">{selectedActivity.title}</h2>
            <p className="text-content-secondary mb-4">{new Date(selectedActivity.date).toLocaleString()}</p>
            <p className="text-content-secondary mb-6">{selectedActivity.description || 'No description.'}</p>
            <div className="flex justify-between items-center">
              <button onClick={closeDetailView} className="px-4 py-2 text-sm font-semibold text-content-secondary rounded-md hover:bg-background-secondary transition-colors">
                Close
              </button>
              {/* This assumes a solo activity will have a flag, e.g., `isSolo`. For now, we show it for all. */}
              <button
                onClick={() => alert('Navigate to live post creation...')} // Placeholder action
                className="px-6 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Create Live Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
