'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import FomoGroupCard from '../../components/ui/FomoGroupCard';
import { usePaginatedGroups } from '@/hooks/usePaginatedGroups';
import { InfiniteScrollTrigger } from '@/components/common/PaginationTrigger';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import { slideDownVariants, fadeInVariants, scaleInVariants } from '../constants/animations';

export default function GroupsPage() {
  const { user } = useAuth();
  
  const {
    groups: userGroups,
    loading: groupsLoading,
    hasMore: hasMoreGroups,
    loadMore: loadMoreGroups,
    triggerRef: groupsTriggerRef,
    error: groupsError
  } = usePaginatedGroups({
    userId: user?.uid,
    enableInfiniteScroll: true
  });

  // Memoize featured group calculation to avoid expensive recalculation on every render
  const dashboardFeaturedGroup = useMemo(() => {
    if (!userGroups || userGroups.length === 0) return null;
    
    // Find the group with the soonest upcoming activity
    const groupsWithActivities = userGroups.filter((group) => 
      group.nextActivity && group.nextActivity.date
    );
    
    if (groupsWithActivities.length === 0) return null;
    
    return groupsWithActivities.reduce((earliest, current) => {
      const earliestDate = new Date(earliest.nextActivity!.date);
      const currentDate = new Date(current.nextActivity!.date);
      return currentDate < earliestDate ? current : earliest;
    });
  }, [userGroups]);

  const dashboardStandardGroups = useMemo(() => 
    userGroups.filter((group) => group.id !== dashboardFeaturedGroup?.id),
    [userGroups, dashboardFeaturedGroup]
  );

  return (
    <AppLayout>
      <div className="w-full max-w-full mx-auto">
        {/* Header */}
        <motion.div 
          variants={slideDownVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass p-4 sm:p-5 lg:p-6 mb-4 sm:mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-heading-1 font-bold text-content-primary mb-2 sm:mb-3">
                Groups
              </h1>
              <p className="text-content-secondary text-body">
                Connect with communities and share interests with like-minded people.
              </p>
            </div>
             <button className="bg-background-secondary text-content-primary hover:bg-opacity-80 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 self-start sm:self-auto transition-all duration-200" onClick={() => window.location.href='/groups/create'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Group</span>
            </button>
          </div>
        </motion.div>

        {/* Content */}
         {groupsLoading ? (
          <motion.div 
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-accent-primary liquid-glass-square flex items-center justify-center"></div>
              <span className="ml-3 text-content-secondary">Loading groups...</span>
            </div>
          </motion.div>
         ) : groupsError ? (
          <motion.div 
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="text-center py-12">
               <p className="text-content-secondary mb-4">{groupsError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-background-secondary text-content-primary hover:bg-opacity-80 px-4 py-2 rounded-card transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        ) : dashboardFeaturedGroup || dashboardStandardGroups.length > 0 ? (
          <div className="p-0">
            {/* Layout with featured group and standard groups grid */}
            <div className="space-y-8">
              
              {/* Featured Group Card - Extra Large */}
              {dashboardFeaturedGroup && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-content-primary">Featured Group</h2>
                    <p className="text-content-secondary mt-1">Don't miss what's happening next!</p>
                  </div>
                  <FomoGroupCard group={dashboardFeaturedGroup} size="xl" />
                </div>
              )}

              {/* Standard Group Cards - Larger Grid Layout */}
              {dashboardStandardGroups.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-content-primary">My Groups</h2>
                    <p className="text-content-secondary mt-1">Stay connected with your communities</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dashboardStandardGroups.map((group) => (
                      <FomoGroupCard key={group.id} group={group} size="medium" />
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  <InfiniteScrollTrigger
                    triggerRef={groupsTriggerRef}
                    loading={groupsLoading}
                    hasMore={hasMoreGroups}
                  />
                </div>
              )}

            </div>
          </div>
        ) : (
          <motion.div 
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
            className="liquid-glass p-4 sm:p-6"
          >
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 liquid-glass-square flex items-center justify-center">
                <svg className="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-content-primary font-semibold mb-2">No groups yet</h3>
              <p className="text-content-secondary mb-4">Join some groups to see them here.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/seed-all', { method: 'POST' });
                      window.location.reload();
                    } catch (e) {
                      if (process.env.NODE_ENV === 'development') {
                        console.error('Seeding failed', e);
                      }
                    }
                  }}
                  className="px-4 py-2 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
                >
                  Seed Demo Content
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
} 