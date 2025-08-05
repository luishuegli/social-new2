'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Users, Sparkles, Plus } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

export default function ActivityPlanModal({ isOpen, onClose, groupName }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [activityData, setActivityData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: ''
  });

  const handleManualCreate = () => {
    setSelectedOption('manual');
  };

  const handleAISuggest = () => {
    setSelectedOption('ai');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creating activity:', activityData);
    // TODO: Implement activity creation API call
    onClose();
    setSelectedOption(null);
    setActivityData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: ''
    });
  };

  const handleAISubmit = () => {
    console.log('Requesting AI suggestions for:', groupName);
    // TODO: Implement AI suggestion API call
    onClose();
    setSelectedOption(null);
  };

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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md"
          >
            <LiquidGlass className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Plan New Activity</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {!selectedOption ? (
                <div className="space-y-4">
                  <p className="text-white/70 text-sm">
                    Choose how you'd like to plan an activity for <span className="font-semibold text-white">{groupName}</span>
                  </p>
                  
                  {/* Manual Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManualCreate}
                    className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center space-x-3"
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">Create Manually</h3>
                      <p className="text-sm text-white/70">Plan your own activity with full control</p>
                    </div>
                  </motion.button>

                  {/* AI Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAISuggest}
                    className="w-full p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center space-x-3"
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">AI Suggestions</h3>
                      <p className="text-sm text-white/70">Get personalized activity recommendations</p>
                    </div>
                  </motion.button>
                </div>
              ) : selectedOption === 'manual' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Activity Title</label>
                    <input
                      type="text"
                      value={activityData.title}
                      onChange={(e) => setActivityData({ ...activityData, title: e.target.value })}
                      className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                      placeholder="Enter activity title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <textarea
                      value={activityData.description}
                      onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                      className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                      placeholder="Describe the activity"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Date</label>
                      <input
                        type="date"
                        value={activityData.date}
                        onChange={(e) => setActivityData({ ...activityData, date: e.target.value })}
                        className="w-full bg-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Time</label>
                      <input
                        type="time"
                        value={activityData.time}
                        onChange={(e) => setActivityData({ ...activityData, time: e.target.value })}
                        className="w-full bg-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Location</label>
                    <input
                      type="text"
                      value={activityData.location}
                      onChange={(e) => setActivityData({ ...activityData, location: e.target.value })}
                      className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Max Participants</label>
                    <input
                      type="number"
                      value={activityData.maxParticipants}
                      onChange={(e) => setActivityData({ ...activityData, maxParticipants: e.target.value })}
                      className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
                      placeholder="Enter max participants"
                      min="1"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOption(null)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
                    >
                      Create Activity
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI Activity Suggestions</h3>
                    <p className="text-white/70 text-sm">
                      Our AI will analyze your group's interests and suggest personalized activities.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">What we'll consider:</h4>
                    <ul className="text-sm text-white/70 space-y-1">
                      <li>• Group member interests and preferences</li>
                      <li>• Previous successful activities</li>
                      <li>• Local events and opportunities</li>
                      <li>• Weather and seasonal factors</li>
                      <li>• Group size and dynamics</li>
                    </ul>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setSelectedOption(null)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleAISubmit}
                      className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Get Suggestions</span>
                    </button>
                  </div>
                </div>
              )}
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 