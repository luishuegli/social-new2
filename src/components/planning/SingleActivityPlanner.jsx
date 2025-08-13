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
    prompt: '',
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
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [coords, setCoords] = useState(null);

  function haversineKm(a, b) {
    if (!a || !b || typeof a.lat !== 'number' || typeof a.lng !== 'number' || typeof b.lat !== 'number' || typeof b.lng !== 'number') return null;
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }

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
    
    // Activity type is optional now; prefer free-text prompt

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
          prompt: formData.prompt,
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
      
      // Optional AI re-ranking step using Gemini
      try {
        const rerankResp = await fetch('/api/rerank-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidates: result.suggestions,
            groupId,
            prompt: formData.prompt,
          })
        });
        if (rerankResp.ok) {
          const reranked = await rerankResp.json();
          if (Array.isArray(reranked?.items) && reranked.items.length) {
            // attach distance if we have coords
            const items = reranked.items.map((it) => {
              const distanceKm = coords && typeof it.lat === 'number' && typeof it.lng === 'number'
                ? haversineKm(coords, { lat: it.lat, lng: it.lng })
                : null;
              return { ...it, distanceKm };
            });
            setGeneratedSuggestions(items);
          } else {
            const items = (result.suggestions || []).map((it) => {
              const distanceKm = coords && typeof it.lat === 'number' && typeof it.lng === 'number'
                ? haversineKm(coords, { lat: it.lat, lng: it.lng })
                : null;
              return { ...it, distanceKm };
            });
            setGeneratedSuggestions(items);
          }
        } else {
          const items = (result.suggestions || []).map((it) => {
            const distanceKm = coords && typeof it.lat === 'number' && typeof it.lng === 'number'
              ? haversineKm(coords, { lat: it.lat, lng: it.lng })
              : null;
            return { ...it, distanceKm };
          });
          setGeneratedSuggestions(items);
        }
      } catch (_) {
        const items = (result.suggestions || []).map((it) => {
          const distanceKm = coords && typeof it.lat === 'number' && typeof it.lng === 'number'
            ? haversineKm(coords, { lat: it.lat, lng: it.lng })
            : null;
          return { ...it, distanceKm };
        });
        setGeneratedSuggestions(items);
      }
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
        title: `AI Suggestions: ${formData.prompt || formData.activityType || 'Activity'}`,
        description: `Based on your preferences: ${formData.budget} budget, ${formData.radius}km radius, ${formData.groupSize} people`,
        type: 'ai_suggestions',
        groupId,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'User',
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + durationMinutes * 60 * 1000,
        totalVotes: 0,
        options: generatedSuggestions.map((s, i) => ({
          id: `opt-${i+1}`,
          title: s.name,
          description: s.description,
          imageUrl: s.imageUrl,
          votes: 0,
          voters: []
        })),
        status: 'active',
      };

      const pollRef = await addDoc(collection(db, 'polls'), pollData);

      // Create related message in group chat
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        type: 'ai_suggestions',
        pollId: pollRef.id,
        content: `🤖 AI Suggestions: ${(formData.prompt || formData.activityType || 'Activity')} - ${generatedSuggestions.length} options found`,
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
            <p className="text-white/70">Describe what you want to do and we’ll find great ideas nearby</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Natural language idea prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            What do you feel like doing?
          </label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="e.g., Chill sunset walk with good photo spots, or find a cozy board game cafe, or adventurous activity for 4 friends"
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Activity Type with Autocomplete */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Activity Type (optional)
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
            <p className="text-white/70">Here are {generatedSuggestions.length} AI-generated suggestions for "{formData.prompt || formData.activityType || 'your idea'}"</p>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 cursor-pointer"
                onClick={() => {
                  const url = suggestion.googleMapsUri || (suggestion.placeId ? `https://www.google.com/maps/search/?api=1&query_place_id=${suggestion.placeId}` : null);
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
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
                    {typeof suggestion.distanceKm === 'number' && (
                      <p className="text-xs text-white/60 mt-1">{suggestion.distanceKm.toFixed(1)} km away</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch('/api/update-preferences', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            groupId,
                            userId: user?.uid,
                            name: suggestion.name,
                            placeId: suggestion.placeId,
                            delta: 1,
                          }),
                        }).catch(() => {});
                      }}
                      className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-400/30 text-xs hover:bg-green-500/30"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch('/api/update-preferences', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            groupId,
                            userId: user?.uid,
                            name: suggestion.name,
                            placeId: suggestion.placeId,
                            delta: -1,
                          }),
                        }).catch(() => {});
                      }}
                      className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-400/30 text-xs hover:bg-red-500/30"
                    >
                      👎
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Voting duration control */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white font-semibold">Voting Duration</div>
                <div className="text-xs text-white/60">How long should this poll stay open?</div>
              </div>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value={30} className="bg-neutral-800 text-white">30 min</option>
                <option value={60} className="bg-neutral-800 text-white">1 hour</option>
                <option value={180} className="bg-neutral-800 text-white">3 hours</option>
                <option value={720} className="bg-neutral-800 text-white">12 hours</option>
                <option value={1440} className="bg-neutral-800 text-white">24 hours</option>
                <option value={4320} className="bg-neutral-800 text-white">3 days</option>
                <option value={10080} className="bg-neutral-800 text-white">7 days</option>
              </select>
            </div>
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