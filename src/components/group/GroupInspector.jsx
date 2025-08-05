'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Check, Calendar, MapPin, Plus } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import ActivityPlanModal from '../ui/ActivityPlanModal';

export default function GroupInspector({ group }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!group) {
    return null;
  }

  // Display the first 6 member avatars
  const displayMembers = group.members?.slice(0, 6) || [];
  const remainingCount = (group.members?.length || 0) - displayMembers.length;

  const handleJoinClick = () => {
    // TODO: Implement join/leave functionality
    console.log(`${group.joined ? 'Leave' : 'Join'} group: ${group.name}`);
  };

  const handlePlanActivity = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="sticky top-6">
        <div className="flex flex-col gap-6">
          {/* GroupHeader Module */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <LiquidGlass className="p-6">
              {/* Group Name and Description */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-content-primary mb-2">
                  {group.name}
                </h1>
                <p className="text-content-secondary text-sm leading-relaxed">
                  {group.description}
                </p>
              </div>

              {/* Member Avatars and Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {displayMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-background-primary overflow-hidden bg-accent-primary flex items-center justify-center"
                        style={{ zIndex: displayMembers.length - index }}
                      >
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-content-primary">
                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                        <span className="text-xs font-semibold text-content-primary">
                          +{remainingCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-content-secondary" />
                    <span className="text-xs text-content-secondary">
                      {group.memberCount || group.members?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Join/Joined Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinClick}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center space-x-1 ${
                    group.joined
                      ? 'bg-content-secondary text-content-primary hover:bg-opacity-80'
                      : 'bg-accent-primary text-content-primary hover:bg-opacity-90'
                  }`}
                >
                  {group.joined ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>✓ Member</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      <span>Join</span>
                    </>
                  )}
                </motion.button>
              </div>
            </LiquidGlass>
          </motion.div>

          {/* UpNextActivity Module */}
          {group.nextActivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <LiquidGlass className="p-6">
                <h2 className="text-lg font-bold text-content-primary mb-3">Up Next</h2>
                
                <div className="space-y-3">
                  {/* Activity Title */}
                  <h3 className="text-sm font-semibold text-content-primary">
                    {group.nextActivity.title}
                  </h3>

                  {/* Activity Details */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-content-secondary" />
                      <span className="text-xs text-content-secondary">
                        {new Date(group.nextActivity.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>

                    {group.nextActivity.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-content-secondary" />
                        <span className="text-xs text-content-secondary truncate">
                          {group.nextActivity.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </LiquidGlass>
            </motion.div>
          )}

          {/* PlanActivityButton - Now wrapped in LiquidGlass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <LiquidGlass className="p-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlanActivity}
                className="w-full px-6 py-4 bg-accent-primary text-content-primary rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Plan New Activity</span>
              </motion.button>
            </LiquidGlass>
          </motion.div>
        </div>
      </div>

      {/* Activity Plan Modal */}
      <ActivityPlanModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        groupName={group.name}
      />
    </>
  );
} 