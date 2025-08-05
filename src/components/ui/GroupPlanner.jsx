'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  MapPin, 
  Users, 
  Camera, 
  Sunset, 
  Mountain, 
  Building,
  Clock,
  Plus,
  Lightbulb
} from 'lucide-react';
import LiquidGlass from './LiquidGlass';

// Mock AI-generated activity suggestions
const mockSuggestions = [
  {
    id: '1',
    title: 'Golden Hour Portrait Session',
    description: 'Capture stunning portraits during the magical golden hour in the downtown park.',
    type: 'photography',
    duration: '2 hours',
    location: 'Central Park Meadow',
    difficulty: 'Beginner Friendly',
    equipment: 'Any camera, reflector optional',
    icon: Sunset,
    estimatedAttendees: '8-12 people'
  },
  {
    id: '2',
    title: 'Urban Architecture Photography Walk',
    description: 'Explore the city\'s architectural gems and learn composition techniques for building photography.',
    type: 'photography',
    duration: '3 hours',
    location: 'Financial District',
    difficulty: 'Intermediate',
    equipment: 'Wide-angle lens recommended',
    icon: Building,
    estimatedAttendees: '6-10 people'
  },
  {
    id: '3',
    title: 'Sunrise Mountain Photography Expedition',
    description: 'Early morning hike to capture breathtaking sunrise views from the peak.',
    type: 'photography',
    duration: '5 hours',
    location: 'Eagle Peak Trail',
    difficulty: 'Advanced',
    equipment: 'Tripod essential, hiking gear',
    icon: Mountain,
    estimatedAttendees: '4-8 people'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function GroupPlanner() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const handleGenerateIdeas = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuggestions(true);
    }, 2000);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner friendly':
        return 'text-support-success';
      case 'intermediate':
        return 'text-support-warning';
      case 'advanced':
        return 'text-support-error';
      default:
        return 'text-content-secondary';
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="w-8 h-8 text-accent-primary" />
          <h2 className="text-3xl font-bold text-content-primary">AI Activity Planner</h2>
        </div>
        <p className="text-content-secondary text-lg max-w-2xl mx-auto">
          Describe your ideal group activity and let AI suggest creative photography experiences tailored to your group
        </p>
      </div>

      {/* AI Prompt Interface */}
      <div className="max-w-3xl mx-auto mb-8">
        <LiquidGlass className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-support-success rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-content-primary" />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Describe your ideal group activity... (e.g., 'I want to organize a fun photography meetup for beginners that focuses on street photography and happens during sunset')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 bg-transparent text-content-primary placeholder-content-secondary resize-none focus:outline-none text-lg"
                rows={3}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-content-secondary" />
                  <span className="text-sm text-content-secondary">
                    Be specific about location, skill level, and photography style
                  </span>
                </div>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center space-x-2 px-6 py-3 bg-accent-primary text-content-primary rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-content-primary border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Generate Ideas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>
      </div>

      {/* AI-Generated Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto mb-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-content-primary mb-2">AI-Generated Suggestions</h3>
              <p className="text-content-secondary">Select an activity to customize and schedule</p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {mockSuggestions.map((suggestion) => {
                const IconComponent = suggestion.icon;
                const isSelected = selectedSuggestion?.id === suggestion.id;
                
                return (
                  <motion.div
                    key={suggestion.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="cursor-pointer"
                  >
                    <LiquidGlass className={`p-6 transition-all duration-200 ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}>
                      {/* Activity Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-accent-primary rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-content-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-content-primary text-lg line-clamp-2">
                            {suggestion.title}
                          </h4>
                          <span className={`text-sm font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                            {suggestion.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Activity Description */}
                      <p className="text-content-secondary text-sm leading-relaxed mb-4 line-clamp-3">
                        {suggestion.description}
                      </p>

                      {/* Activity Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-content-secondary" />
                          <span className="text-sm text-content-secondary">{suggestion.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-content-secondary" />
                          <span className="text-sm text-content-secondary">{suggestion.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-content-secondary" />
                          <span className="text-sm text-content-secondary">{suggestion.estimatedAttendees}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Camera className="w-4 h-4 text-content-secondary" />
                          <span className="text-sm text-content-secondary">{suggestion.equipment}</span>
                        </div>
                      </div>

                      {/* Select Button */}
                      <button 
                        className={`
                          w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2
                          ${isSelected
                            ? 'bg-accent-primary text-content-primary'
                            : 'bg-background-secondary text-content-secondary hover:bg-accent-primary hover:text-content-primary'
                          }
                        `}
                      >
                        {isSelected ? (
                          <>
                            <Calendar className="w-4 h-4" />
                            <span>Selected - Schedule Activity</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Select This Activity</span>
                          </>
                        )}
                      </button>
                    </LiquidGlass>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Planning Tools */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-content-primary mb-2">Manual Planning Tools</h3>
          <p className="text-content-secondary">Prefer to plan manually? Use our comprehensive activity builder</p>
        </div>

        <LiquidGlass className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Calendar, title: 'Date & Time', description: 'Schedule your activity' },
              { icon: MapPin, title: 'Location', description: 'Set meeting point & route' },
              { icon: Users, title: 'Participants', description: 'Manage attendees & capacity' },
              { icon: Camera, title: 'Equipment', description: 'List required gear' },
              { icon: Lightbulb, title: 'Learning Goals', description: 'Define objectives' },
              { icon: Sparkles, title: 'Special Notes', description: 'Add custom instructions' }
            ].map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={index}
                  className="p-4 bg-background-secondary hover:bg-accent-primary hover:text-content-primary text-content-secondary rounded-xl transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <h4 className="font-semibold text-sm">{tool.title}</h4>
                      <p className="text-xs opacity-80">{tool.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <button className="px-8 py-3 bg-accent-primary text-content-primary rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200">
              Start Manual Planning
            </button>
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
}