'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Users, Clock, CheckCircle, HelpCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import ActivityDetailModal from './ActivityDetailModal';
import SoloActivityModal from '@/app/components/SoloActivityModal';

interface Activity {
  id: string;
  title?: string;
  description?: string;
  date?: any;
  location?: string;
  groupId?: string;
  groupName?: string;
  participants?: string[];
  interested?: string[];
  left?: string[];
  participantProfiles?: any[];
  interestedProfiles?: any[];
  status?: string;
  creatorId?: string;
  type?: 'group' | 'solo';
}

interface EnhancedCalendarViewProps {
  activities: Activity[];
  onActivityCreated?: () => void;
  userId: string;
}

export default function EnhancedCalendarView({ activities, onActivityCreated, userId }: EnhancedCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getActivitiesForDate = (date: Date) => {
    return activities.filter(activity => {
      if (!activity.date) return false;
      
      // Handle Firestore timestamp
      let activityDate;
      if (activity.date.toDate && typeof activity.date.toDate === 'function') {
        activityDate = activity.date.toDate();
      } else {
        activityDate = new Date(activity.date);
      }
      
      return activityDate.getDate() === date.getDate() &&
             activityDate.getMonth() === date.getMonth() &&
             activityDate.getFullYear() === date.getFullYear();
    });
  };

  const getUserStatus = (activity: Activity): 'going' | 'maybe' | 'not-going' | 'no-response' => {
    if ((activity.participants || []).includes(userId)) {
      return 'going';
    } else if ((activity.interested || []).includes(userId)) {
      return 'maybe';
    } else if ((activity.left || []).includes(userId)) {
      return 'not-going';
    }
    return 'no-response';
  };

  const getStatusColor = (status: 'going' | 'maybe' | 'not-going' | 'no-response') => {
    switch (status) {
      case 'going':
        return 'bg-green-500';
      case 'maybe':
        return 'bg-yellow-500';
      case 'not-going':
        return 'bg-red-500';
      case 'no-response':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: 'going' | 'maybe' | 'not-going' | 'no-response') => {
    switch (status) {
      case 'going':
        return <CheckCircle className="w-3 h-3" />;
      case 'maybe':
        return <HelpCircle className="w-3 h-3" />;
      case 'not-going':
        return <XCircle className="w-3 h-3" />;
      case 'no-response':
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const today = new Date();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleModalClose = () => {
    setSelectedActivity(null);
    if (onActivityCreated) {
      onActivityCreated();
    }
  };

  const handleCreateSoloActivity = async (activityData: any) => {
    try {
      const response = await fetch('/api/activities/solo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...activityData, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create solo activity');
      }

      setIsCreateModalOpen(false);
      
      if (onActivityCreated) {
        onActivityCreated();
      }
    } catch (error) {
      console.error(error);
      alert('There was an error creating the activity.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 liquid-glass p-6 rounded-xl border border-gray-200/20 dark:border-gray-700/20">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-content-primary" />
          </button>

          <h2 className="text-2xl font-bold text-content-primary">
            {monthName} {year}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-content-primary" />
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const dayActivities = getActivitiesForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;

            return (
              <div
                key={day}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isToday 
                    ? 'border-accent-primary bg-accent-primary/10' 
                    : 'border-gray-200/30 dark:border-gray-700/30'
                  }
                  ${isPast ? 'opacity-50' : ''}
                  ${dayActivities.length > 0 ? 'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50' : ''}
                `}
              >
                <div className="text-sm font-semibold text-content-primary mb-1">{day}</div>
                <div className="space-y-1">
                  {dayActivities.slice(0, 3).map(activity => {
                    const status = getUserStatus(activity);
                    return (
                      <div
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className={`
                          px-1.5 py-0.5 rounded text-xs truncate cursor-pointer
                          ${getStatusColor(status)} bg-opacity-20
                          hover:bg-opacity-30 transition-all
                          flex items-center space-x-1
                        `}
                        title={activity.title}
                      >
                        <span className={`${getStatusColor(status)} bg-opacity-100 text-white rounded-full p-0.5`}>
                          {getStatusIcon(status)}
                        </span>
                        <span className="truncate text-content-primary font-medium">{activity.title}</span>
                      </div>
                    );
                  })}
                  {dayActivities.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                      +{dayActivities.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
          <h3 className="text-sm font-semibold text-content-primary mb-3">RSVP Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                <CheckCircle className="w-3 h-3" />
              </div>
              <span className="text-sm text-content-secondary">Going</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                <HelpCircle className="w-3 h-3" />
              </div>
              <span className="text-sm text-content-secondary">Maybe</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white">
                <XCircle className="w-3 h-3" />
              </div>
              <span className="text-sm text-content-secondary">Not Going</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <AlertCircle className="w-3 h-3" />
              </div>
              <span className="text-sm text-content-secondary">No Response</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Solo Activity Card */}
      <div className="liquid-glass p-6 rounded-xl border border-gray-200/20 dark:border-gray-700/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-content-primary">Schedule Solo Activity</h3>
        </div>
        
        <p className="text-content-secondary mb-6">
          Create a personal activity and add it to your calendar.
        </p>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-secondary transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Solo Activity</span>
        </button>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-border-separator space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Total Activities</span>
            <span className="text-lg font-bold text-content-primary">{activities.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Going</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {activities.filter(a => getUserStatus(a) === 'going').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Pending</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {activities.filter(a => getUserStatus(a) === 'no-response').length}
            </span>
          </div>
        </div>
      </div>

      <SoloActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSoloActivity}
      />

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={handleModalClose}
          userId={userId}
          onActivityCreated={onActivityCreated}
        />
      )}
    </div>
  );
}

