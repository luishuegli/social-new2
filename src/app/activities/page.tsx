'use client';

import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { motion } from 'framer-motion';
import { List, Calendar as CalendarIcon } from 'lucide-react';
import EnhancedActivityCard from '../../components/ui/EnhancedActivityCard';
import EnhancedCalendarView from './components/EnhancedCalendarView';
import { usePaginatedActivities } from '@/hooks/usePaginatedActivities';
import { InfiniteScrollTrigger } from '@/components/common/PaginationTrigger';
import { listContainerVariants, listItemVariants } from '../constants/animations';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { startActivity, activeActivity } = useActivity();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  
  const {
    activities,
    loading: activitiesLoading,
    hasMore: hasMoreActivities,
    loadMore: loadMoreActivities,
    triggerRef: activitiesTriggerRef
  } = usePaginatedActivities({
    enableInfiniteScroll: view === 'list' // Only enable for list view
  });

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Please sign in to view activities</h2>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-full">
        {/* Header */}
        <div className="liquid-glass sticky top-0 z-10 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-8 h-8 text-content-primary" />
                <h1 className="text-2xl font-bold text-content-primary">Activities</h1>
              </div>
            </div>

            {/* View Toggle */}
            <div className="mb-6">
              <div className="liquid-glass p-4">
                <div className="flex justify-center">
                  <div className="flex space-x-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-1.5 w-full max-w-xl">
                    <button
                      onClick={() => setView('list')}
                      className={`
                        flex-1 px-8 py-4 rounded-lg text-body font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                        focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                        active:outline-none active:ring-0 active:border-0 active:shadow-none
                        ${view === 'list'
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                        }
                      `}
                      style={{ outline: 'none' }}
                    >
                      <List className="w-5 h-5" />
                      <span>List View</span>
                    </button>
                    <button
                      onClick={() => setView('calendar')}
                      className={`
                        flex-1 px-8 py-4 rounded-lg text-body font-semibold transition-all duration-200 flex items-center justify-center space-x-2
                        focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none
                        active:outline-none active:ring-0 active:border-0 active:shadow-none
                        ${view === 'calendar'
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200'
                        }
                      `}
                      style={{ outline: 'none' }}
                    >
                      <CalendarIcon className="w-5 h-5" />
                      <span>Calendar View</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 pt-32 pb-12 relative">
          {view === 'list' ? (
            <>
              {/* Loading State */}
              {activitiesLoading && activities.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-content-primary" />
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Loading activities...</p>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No activities found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Join some groups or create your first activity to get started!
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Activities List */}
                  {activities.map((activity) => (
                    <motion.div key={activity.id} variants={listItemVariants}>
                      <EnhancedActivityCard
                        activity={activity}
                        onStartActivity={startActivity}
                        onActivityUpdate={() => {}}
                      />
                    </motion.div>
                  ))}

                  {/* Infinite scroll trigger */}
                  <InfiniteScrollTrigger
                    triggerRef={activitiesTriggerRef}
                    loading={activitiesLoading}
                    hasMore={hasMoreActivities}
                  />
                </motion.div>
              )}
            </>
          ) : (
            <EnhancedCalendarView
              activities={activities}
              onActivityCreated={() => {}}
              userId={user.uid}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
