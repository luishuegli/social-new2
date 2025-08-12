'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, DollarSign, Users } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import { useAuth } from '../../app/contexts/AuthContext';
import { db } from '../../app/Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SingleActivityPlanner({ onClose, groupId = 'group-6' }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    activityType: '',
    budget: '$',
    radius: 25,
    groupSize: 2,
    suggestionCount: 3
  });

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState([]);
  const [showApproval, setShowApproval] = useState(false);
  const [coords, setCoords] = useState(null);

  // Focus on real activities rather than broad categories
  const activityTypes = [
    'Golf', 'Mini Golf', 'Bowling', 'Escape Room', 'Karaoke', 'Arcade', 'Go Karting', 'Laser Tag', 'Trampoline Park',
    'Hiking', 'Rock Climbing', 'Indoor Climbing', 'Kayaking', 'Stand Up Paddleboarding', 'Boat Tour', 'Bike Tour',
    'Tennis', 'Pickleball', 'Basketball', 'Soccer', 'Yoga Class', 'Dance Class', 'Gym Session',
    'Cooking Class', 'Wine Tasting', 'Brewery Tour', 'Coffee Tasting', 'Food Tour',
    'Museum', 'Art Gallery', 'Painting Class', 'Pottery Class', 'Live Music', 'Comedy Show', 'Movie Night', 'Theater',
    'Spa Day', 'Picnic', 'Board Games Cafe', 'Zoo', 'Aquarium', 'Shopping'
  ];

  const budgetOptions = [
    { value: 'Free', label: 'Free', icon: null, color: 'text-white' },
    { value: '$', label: 'Inexpensive', icon: DollarSign, color: 'text-white' },
    { value: '$$', label: 'Moderate', icon: DollarSign, color: 'text-white' },
    { value: '$$$', label: 'Pricey', icon: DollarSign, color: 'text-white' }
  ];

  const handleActivityTypeChange = (value) => {
    setFormData(prev => ({ ...prev, activityType: value }));
    setShowSuggestions(false);
  };

  const handleActivityTypeInput = (value) => {
    setFormData(prev => ({ ...prev, activityType: value }));
    
    if (value.trim()) {
      const filtered = activityTypes.filter(type => 
        type.toLowerCase().includes(value.toLowerCase())
      );
      // If no predefined activity matches, still allow using the free text
      if (filtered.length === 0) {
        setSuggestions([value.trim()]);
      } else {
        setSuggestions(filtered);
      }
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.activityType.trim()) {
      alert('Please select an activity type');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🤖 Generating AI suggestions for:', formData);
      // Try to get geolocation (non-blocking with short timeout)
      if (!coords && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          await new Promise((resolve) => {
            const timeoutId = setTimeout(() => resolve(null), 2500);
            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timeoutId);
                setCoords({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
                resolve(null);
              },
              () => resolve(null),
              { enableHighAccuracy: false, timeout: 2000, maximumAge: 30000 }
            );
          });
        } catch (_) {
          // ignore geolocation errors
        }
      }
      
      // Call API to generate suggestions (without creating poll yet)
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: formData.activityType,
          budget: formData.budget,
          radius: formData.radius,
          groupSize: formData.groupSize,
          suggestionCount: formData.suggestionCount,
          lat: coords?.lat,
          lng: coords?.lng
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        const message = result?.details
          ? `${result.error || 'Failed to generate suggestions'}: ${result.details}`
          : (result.error || 'Failed to generate suggestions');
        throw new Error(message);
      }

      console.log('✅ AI suggestions generated:', result);
      
      // Show approval screen
      setGeneratedSuggestions(result.suggestions);
      setShowApproval(true);
      
    } catch (error) {
      console.error('❌ Error generating AI suggestions:', error);
      alert(`Failed to generate suggestions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestions = async () => {
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('You must be signed in to create a poll');
      }

      // Create poll directly with client SDK so user auth is used in rules
      const pollData = {
        title: `AI Suggestions: ${formData.activityType}`,
        description: `Based on your preferences: ${formData.budget} budget, ${formData.radius}km radius, ${formData.groupSize} people`,
        type: 'ai_suggestions',
        groupId,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'User',
        createdAt: serverTimestamp(),
        expiresAt: null,
        totalVotes: 0,
        options: generatedSuggestions.map((s, i) => ({
          id: `opt-${i+1}`,
          title: s.name,
          description: s.description,
          imageUrl: s.imageUrl,
          votes: 0,
          voters: []
        })),
        isActive: true,
      };

      const pollRef = await addDoc(collection(db, 'polls'), pollData);

      // Create related message in group chat
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        type: 'ai_suggestions',
        pollId: pollRef.id,
        content: `🤖 AI Suggestions: ${formData.activityType} - ${generatedSuggestions.length} options found`,
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        timestamp: serverTimestamp(),
        groupId,
      });
      
      // Show success message before closing
      alert(`🎉 Great! AI suggestions poll created successfully!\n\nA poll with ${generatedSuggestions.length} activity options has been created in your group chat. Check it out!`);
      
      // Close the modal
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating poll:', error);
      alert(`Failed to create poll: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showApproval ? (
        <>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Single Activity Planner</h3>
            <p className="text-white/70">Get AI-powered suggestions for the perfect activity</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type with Autocomplete */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Activity Type
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={formData.activityType}
                onChange={(e) => handleActivityTypeInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for activity types..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleActivityTypeChange(suggestion)}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Segmented Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Budget
          </label>
          <div className="grid grid-cols-4 gap-2">
            {budgetOptions.map(option => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, budget: option.value }))}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.budget === option.value
                      ? 'bg-accent-primary border-accent-primary text-white'
                      : 'bg-white/10 border-white/20 text-neutral-300 hover:bg-white/20'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {option.icon ? (
                      <span className={`text-lg font-bold ${option.color}`}>{option.value}</span>
                    ) : (
                      <span className={`text-lg font-bold ${option.color}`}>Free</span>
                    )}
                  </div>
                  <div className="text-xs text-center">{option.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Radius Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Search Radius: {formData.radius}km
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={formData.radius}
            onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-neutral-400">
            <span>5km</span>
            <span>50km</span>
          </div>
        </div>

        {/* Group Size Slider */}
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

        {/* Number of Suggestions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Number of Suggestions: {formData.suggestionCount}
          </label>
          <input
            type="range"
            min="3"
            max="10"
            step="1"
            value={formData.suggestionCount}
            onChange={(e) => setFormData(prev => ({ ...prev, suggestionCount: parseInt(e.target.value) }))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-neutral-400">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Generating AI Suggestions...</span>
            </div>
          ) : (
            'Generate AI Suggestions'
          )}
        </button>
          </form>
        </>
      ) : (
        // Approval Screen
        <>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Review AI Suggestions</h3>
            <p className="text-white/70">Here are {generatedSuggestions.length} AI-generated suggestions for "{formData.activityType}"</p>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 rounded-lg p-4 border border-white/20"
              >
                <div className="flex items-start space-x-4">
                  {suggestion.imageUrl && (
                    <img
                      src={suggestion.imageUrl}
                      alt={suggestion.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{suggestion.name}</h4>
                    <p className="text-sm text-white/70">{suggestion.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowApproval(false)}
              className="flex-1 py-3 px-6 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              ← Generate Different Suggestions
            </button>
            <button
              onClick={handleApproveSuggestions}
              disabled={isLoading}
              className="flex-1 py-3 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Poll...</span>
                </div>
              ) : (
                `✅ Approve & Create Poll (${generatedSuggestions.length} options)`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 