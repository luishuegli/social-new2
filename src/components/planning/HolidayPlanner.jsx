'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function HolidayPlanner({ onClose }) {
  const [currentStep, setCurrentStep] = useState('destination'); // destination, vibe, destinations, itinerary
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    groupSize: 2,
    vibe: {
      adventure: 50,
      relaxation: 50,
      culture: 50,
      nightlife: 50
    }
  });
  const [destinations, setDestinations] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep === 'destination') {
      // Better validation with specific error messages
      if (!formData.destination.trim()) {
        alert('Please enter a destination');
        return;
      }
      if (!formData.startDate) {
        alert('Please select a start date');
        return;
      }
      if (!formData.endDate) {
        alert('Please select an end date');
        return;
      }
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        alert('End date must be after start date');
        return;
      }
      setCurrentStep('vibe');
    } else if (currentStep === 'vibe') {
      setIsLoading(true);
      try {
        // Call API to get destination suggestions
        const response = await fetch('/api/planActivity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flow: 'holiday',
            destination: formData.destination,
            startDate: formData.startDate,
            endDate: formData.endDate,
            groupSize: formData.groupSize,
            vibe: formData.vibe
          })
        });

        const result = await response.json();
        if (response.ok) {
          setDestinations(result.destinations || []);
          setCurrentStep('destinations');
        } else {
          throw new Error(result.error || 'Failed to get destinations');
        }
      } catch (error) {
        console.error('Error getting destinations:', error);
        alert(`Failed to get destinations: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'vibe') {
      setCurrentStep('destination');
    } else if (currentStep === 'destinations') {
      setCurrentStep('vibe');
    }
  };

  const updateVibeValue = (vibeType, value) => {
    setFormData(prev => ({
      ...prev,
      vibe: {
        ...prev.vibe,
        [vibeType]: value
      }
    }));
  };

  const vibeOptions = [
    { key: 'adventure', label: 'Adventure', icon: '🏔️', color: 'from-orange-500 to-red-600' },
    { key: 'relaxation', label: 'Relaxation', icon: '🧘', color: 'from-blue-500 to-cyan-600' },
    { key: 'culture', label: 'Culture', icon: '🏛️', color: 'from-purple-500 to-pink-600' },
    { key: 'nightlife', label: 'Nightlife', icon: '🌃', color: 'from-yellow-500 to-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Holiday Planner</h3>
        <p className="text-white/70">
          {currentStep === 'destination' && 'Where would you like to go?'}
          {currentStep === 'vibe' && 'What kind of trip vibe are you looking for?'}
          {currentStep === 'destinations' && 'Choose your perfect destination'}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className={`w-3 h-3 rounded-full ${currentStep === 'destination' ? 'bg-accent-primary' : 'bg-white/20'}`} />
        <div className={`w-8 h-0.5 ${currentStep === 'vibe' || currentStep === 'destinations' ? 'bg-accent-primary' : 'bg-white/20'}`} />
        <div className={`w-3 h-3 rounded-full ${currentStep === 'vibe' ? 'bg-accent-primary' : 'bg-white/20'}`} />
        <div className={`w-8 h-0.5 ${currentStep === 'destinations' ? 'bg-accent-primary' : 'bg-white/20'}`} />
        <div className={`w-3 h-3 rounded-full ${currentStep === 'destinations' ? 'bg-accent-primary' : 'bg-white/20'}`} />
      </div>

      {/* Step 1: Destination & Dates */}
      {currentStep === 'destination' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Destination */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Where do you want to go?"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Travel Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Group Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Group Size: {formData.groupSize} people
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={formData.groupSize}
              onChange={(e) => setFormData(prev => ({ ...prev, groupSize: parseInt(e.target.value) }))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 transition-all duration-200"
          >
            Next: Vibe Check
          </button>
        </motion.div>
      )}

      {/* Step 2: Vibe Check */}
      {currentStep === 'vibe' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">Trip Vibe Check</h4>
            <p className="text-white/70 text-sm">Adjust the sliders to match your perfect trip vibe</p>
          </div>

          {/* Vibe Sliders */}
          <div className="space-y-6">
            {vibeOptions.map((vibe) => (
              <div key={vibe.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${vibe.color} flex items-center justify-center text-lg`}>
                      {vibe.icon}
                    </div>
                    <span className="text-white font-medium">{vibe.label}</span>
                  </div>
                  <span className="text-white/70 text-sm">{formData.vibe[vibe.key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.vibe[vibe.key]}
                  onChange={(e) => updateVibeValue(vibe.key, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 py-4 px-6 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Finding Destinations...</span>
                </div>
              ) : (
                'Get Destinations'
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Destination Cards */}
      {currentStep === 'destinations' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">Perfect Matches</h4>
            <p className="text-white/70 text-sm">Based on your vibe preferences</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {destinations.map((destination, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-lg"
              >
                <LiquidGlass className="p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={destination.imageUrl}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-lg font-semibold text-white">{destination.name}</h5>
                        <div className="flex items-center space-x-1">
                          <span className="text-green-400 text-sm font-semibold">{destination.matchScore}%</span>
                          <span className="text-white/50 text-xs">match</span>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm">{destination.description}</p>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 py-4 px-6 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 transition-all duration-200"
            >
              Start Planning
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
} 