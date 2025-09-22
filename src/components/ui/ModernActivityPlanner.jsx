'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Filter, 
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Zap,
  ChevronDown,
  Search,
  Star,
  TrendingUp,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import { ACTIVITY_CATEGORIES } from '../../lib/activityGenerator.js';

export default function ModernActivityPlanner({ 
  isOpen, 
  onClose, 
  onCreateActivity,
  groupName,
  groupId 
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [preferences, setPreferences] = useState({
    difficulty: 'Easy',
    maxDuration: 4,
    budget: 'medium',
    timeOfDay: 'afternoon',
    groupSize: 'small'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const budgetOptions = [
    { value: 'free', label: 'Free', icon: '🆓', description: 'No cost activities' },
    { value: 'low', label: 'Budget-Friendly', icon: '💰', description: 'Under $25 per person' },
    { value: 'medium', label: 'Moderate', icon: '💳', description: '$25-60 per person' },
    { value: 'high', label: 'Premium', icon: '💎', description: '$60+ per person' }
  ];

  const difficultyOptions = [
    { value: 'Easy', label: 'Easy', color: 'text-green-400', description: 'Perfect for everyone' },
    { value: 'Beginner', label: 'Beginner', color: 'text-green-400', description: 'Minimal experience needed' },
    { value: 'Moderate', label: 'Moderate', color: 'text-yellow-400', description: 'Some experience helpful' },
    { value: 'Intermediate', label: 'Intermediate', color: 'text-orange-400', description: 'Good experience required' },
    { value: 'Advanced', label: 'Advanced', color: 'text-red-400', description: 'Expert level' }
  ];

  const timeOfDayOptions = [
    { value: 'morning', label: 'Morning', icon: 'Sunrise', time: '6AM - 12PM' },
    { value: 'afternoon', label: 'Afternoon', icon: 'Sun', time: '12PM - 6PM' },
    { value: 'evening', label: 'Evening', icon: 'Sunset', time: '6PM - 10PM' },
    { value: 'night', label: 'Night', icon: 'Moon', time: '10PM+' }
  ];

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  const handleGenerateActivity = async () => {
    if (!selectedCategory) return;
    
    setIsGenerating(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const activityData = {
        category: selectedCategory,
        preferences,
        groupName,
        groupId
      };
      
      onCreateActivity?.(activityData);
      onClose();
    } catch (error) {
      console.error('Error generating activity:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <LiquidGlass className="h-full">
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                      <span>Create Amazing Activity</span>
                    </h2>
                    <p className="text-white/70 mt-1">
                      AI-powered activity planning for {groupName}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Sidebar - Category Selection */}
                <div className="w-1/3 p-6 border-r border-white/10 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Filter className="w-5 h-5" />
                    <span>Choose Category</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => (
                      <motion.button
                        key={key}
                        onClick={() => handleCategorySelect(key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                          selectedCategory === key
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.emoji}</span>
                          <div>
                            <div className="font-semibold text-white text-sm">{category.name}</div>
                            <div className="text-white/60 text-xs">
                              {category.activities.length} activities
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Main Content - Preferences */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {selectedCategory ? (
                    <div className="space-y-6">
                      {/* Selected Category Header */}
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/20">
                        <span className="text-3xl">{ACTIVITY_CATEGORIES[selectedCategory].emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {ACTIVITY_CATEGORIES[selectedCategory].name}
                          </h3>
                          <p className="text-white/70 text-sm">
                            Customize your perfect activity experience
                          </p>
                        </div>
                      </div>

                      {/* Preferences Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Difficulty Level */}
                        <div>
                          <label className="block text-white font-semibold mb-3">
                            Difficulty Level
                          </label>
                          <div className="space-y-2">
                            {difficultyOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setPreferences(prev => ({ ...prev, difficulty: option.value }))}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                  preferences.difficulty === option.value
                                    ? 'bg-white/10 border border-white/20'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${option.color}`}>
                                    {option.label}
                                  </span>
                                  <span className="text-white/60 text-xs">
                                    {option.description}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Budget Range */}
                        <div>
                          <label className="block text-white font-semibold mb-3">
                            Budget Range
                          </label>
                          <div className="space-y-2">
                            {budgetOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setPreferences(prev => ({ ...prev, budget: option.value }))}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                  preferences.budget === option.value
                                    ? 'bg-white/10 border border-white/20'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{option.icon}</span>
                                  <div>
                                    <div className="font-medium text-white">{option.label}</div>
                                    <div className="text-white/60 text-xs">{option.description}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time of Day */}
                        <div>
                          <label className="block text-white font-semibold mb-3">
                            Preferred Time
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {timeOfDayOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setPreferences(prev => ({ ...prev, timeOfDay: option.value }))}
                                className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                  preferences.timeOfDay === option.value
                                    ? 'bg-white/10 border border-white/20'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                <div className="mb-1">
                                  {option.icon === 'Sunrise' && <Sunrise className="w-5 h-5 mx-auto text-white" />}
                                  {option.icon === 'Sun' && <Sun className="w-5 h-5 mx-auto text-white" />}
                                  {option.icon === 'Sunset' && <Sunset className="w-5 h-5 mx-auto text-white" />}
                                  {option.icon === 'Moon' && <Moon className="w-5 h-5 mx-auto text-white" />}
                                </div>
                                <div className="font-medium text-white text-sm">{option.label}</div>
                                <div className="text-white/60 text-xs">{option.time}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-white font-semibold mb-3">
                            Max Duration: {preferences.maxDuration} hours
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={preferences.maxDuration}
                            onChange={(e) => setPreferences(prev => ({ ...prev, maxDuration: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-white/60 text-xs mt-1">
                            <span>1h</span>
                            <span>4h</span>
                            <span>8h</span>
                          </div>
                        </div>
                      </div>

                      {/* Preview Activities */}
                      <div className="mt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span>Sample Activities</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {ACTIVITY_CATEGORIES[selectedCategory].activities.slice(0, 3).map((activity, index) => (
                            <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="font-medium text-white text-sm">{activity.name}</div>
                              <div className="text-white/60 text-xs flex items-center space-x-4 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{activity.duration}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>{activity.difficulty}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Choose an Activity Category
                        </h3>
                        <p className="text-white/70">
                          Select a category from the sidebar to start creating your perfect activity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              {selectedCategory && (
                <div className="p-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-white/70 text-sm">
                      AI will generate personalized activities based on your preferences
                    </div>
                    <motion.button
                      onClick={handleGenerateActivity}
                      disabled={isGenerating}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>Generate Activity</span>
                        </>
                      )}
                    </motion.button>
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
