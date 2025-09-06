'use client';

import React, { useState } from 'react';
import { Gift, DollarSign, Coins, Crown } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function AIPlannerForm({ onGenerateSuggestions }) {
  const [formData, setFormData] = useState({
    prompt: '',
    budget: 'Any',
    radius: 25,
    count: 3,
    durationMinutes: 60
  });

  const [isLoading, setIsLoading] = useState(false);



  const budgetOptions = [
    { value: 'Free', label: 'Free', icon: Gift, color: 'text-white' },
    { value: '$', label: 'Inexpensive', icon: DollarSign, color: 'text-white' },
    { value: '$$', label: 'Moderate', icon: Coins, color: 'text-white' },
    { value: '$$$', label: 'Pricey', icon: Crown, color: 'text-white' },
    { value: 'Any', label: 'No Budget Limit', icon: Crown, color: 'text-white' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate prompt is provided
    if (!formData.prompt.trim()) {
      alert('Please describe what kind of activity you\'re looking for');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onGenerateSuggestions(formData);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <LiquidGlass className="p-6 max-w-lg mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">AI Activity Planner</h2>
          <p className="text-neutral-400">Set your preferences for personalized suggestions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Prompt */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              What kind of activity are you looking for?
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => updateFormData('prompt', e.target.value)}
              placeholder="e.g., Chill sunset walk with good photo spots, or find a cozy board game cafe, or adventurous activity for 4 friends"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>

          {/* Budget */}
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
                    onClick={() => updateFormData('budget', option.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      formData.budget === option.value
                        ? 'bg-content-secondary border-content-secondary text-white'
                        : 'bg-white/10 border-white/20 text-neutral-300 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <IconComponent className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <div className="text-xs text-center">{option.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radius */}
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
              onChange={(e) => updateFormData('radius', parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>5km</span>
              <span>50km</span>
            </div>
          </div>

          {/* Number of Suggestions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Number of Suggestions: {formData.count}
            </label>
            <input
              type="range"
              min="2"
              max="5"
              step="1"
              value={formData.count}
              onChange={(e) => updateFormData('count', parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Voting Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Voting Duration (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={7 * 24 * 60}
              value={formData.durationMinutes}
              onChange={(e) => updateFormData('durationMinutes', Number(e.target.value))}
              className="w-40 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
      </div>
    </LiquidGlass>
  );
}