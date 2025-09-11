'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, Users, MapPin, Clock, DollarSign } from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import SingleActivityPlanner from '../planning/SingleActivityPlanner';
import ManualPollCreator from '../planning/ManualPollCreator';

export default function ActivityPlanModal({ isOpen, onClose, groupName, groupId }) {
  const [currentFlow, setCurrentFlow] = useState(null);
  
  // Extract group ID from URL if not provided
  const currentGroupId = groupId || (typeof window !== 'undefined' ? window.location.pathname.split('/groups/')[1] : 'group-6');
  const handleFlowSelect = (flow) => {
    setCurrentFlow(flow);
  };

  const handleBack = () => {
    setCurrentFlow(null);
  };

  const handleClose = () => {
    setCurrentFlow(null);
    onClose();
  };

  const planningOptions = [
    {
      id: 'singleActivity',
      title: 'A Single Activity',
      subtitle: 'AI-powered suggestions for one perfect activity',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      description: 'Get personalized recommendations based on your group\'s interests and preferences.'
    },
    {
      id: 'manualPoll',
      title: 'A Manual Poll',
      subtitle: 'Create custom polls with images and descriptions',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      description: 'Design your own activity poll with images and let your group vote on the options.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden"
          >
            <LiquidGlass className="p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentFlow ? 'Activity Planner' : 'Plan Something Amazing'}
                  </h2>
                  <p className="text-white/70">
                    {currentFlow ? 'Choose your planning approach' : `What would you like to plan today${groupName ? ` for ${groupName}` : ''}?`}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Back Button for Sub-flows */}
              {currentFlow && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleBack}
                  className="mb-6 flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Options</span>
                </motion.button>
              )}

              {/* Content */}
              {!currentFlow ? (
                // Initial Choice Screen
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {planningOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleFlowSelect(option.id)}
                          className="w-full h-full text-left"
                        >
                          <LiquidGlass className="p-6 h-full hover:bg-white/5 transition-all duration-200">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center mb-4`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold text-white mb-2">{option.title}</h3>
                            <p className="text-sm text-white/70 mb-3">{option.subtitle}</p>
                            <p className="text-xs text-white/50">{option.description}</p>
                          </LiquidGlass>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // Specific Flow Components
                <AnimatePresence mode="wait">
                  {currentFlow === 'singleActivity' && (
                    <motion.div
                      key="singleActivity"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SingleActivityPlanner onClose={handleClose} groupId={currentGroupId} />
                    </motion.div>
                  )}

                  {/* Holiday planner removed for MVP; returning in v2 */}

                  {currentFlow === 'manualPoll' && (
                    <motion.div
                      key="manualPoll"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ManualPollCreator onClose={handleClose} groupId={currentGroupId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 