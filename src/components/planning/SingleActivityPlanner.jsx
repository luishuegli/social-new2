'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

import { useAuth } from '../../app/contexts/AuthContext';
import { db } from '../../app/Lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export default function SingleActivityPlanner({ onClose, groupId = 'group-6' }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    prompt: '',
    budget: 'Any',
    radius: 25,
    groupSize: 2,
    suggestionCount: 3
  });

  const [isLoading, setIsLoading] = useState(false);

  const [generatedSuggestions, setGeneratedSuggestions] = useState([]);
  const [showApproval, setShowApproval] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [coords, setCoords] = useState(null);
  const [exclude, setExclude] = useState({ names: [], ids: [] });

  // Replace a suggestion with a fresh alternative (keeps list length constant)
  const replaceWithAlternative = async (replaceIndex, clicked) => {
    try {
      const nextExclude = {
        names: Array.from(new Set([...(exclude.names || []), String(clicked?.name || '').toLowerCase()])),
        ids: Array.from(new Set([...(exclude.ids || []), clicked?.placeId].filter(Boolean)))
      };
      setExclude(nextExclude);

      const resp = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          budget: formData.budget,
          radius: formData.radius,
          groupSize: formData.groupSize,
          suggestionCount: 1,
          lat: coords?.lat,
          lng: coords?.lng,
          excludeKeys: nextExclude.names,
          excludePlaceIds: nextExclude.ids,
        })
      });
      const data = await resp.json();
      const fresh = Array.isArray(data?.suggestions) ? data.suggestions[0] : null;
      if (!fresh) {
        // If backend had nothing else, just remove the card
        setGeneratedSuggestions((prev) => prev.filter((_, i) => i !== replaceIndex));
        return;
      }
      const distanceKm = coords && typeof fresh.lat === 'number' && typeof fresh.lng === 'number'
        ? haversineKm(coords, { lat: fresh.lat, lng: fresh.lng })
        : null;
      const replacement = { ...fresh, distanceKm };
      setGeneratedSuggestions((prev) => {
        const next = [...prev];
        next[replaceIndex] = replacement;
        return next;
      });
    } catch (_) {
      // On error, remove the card to avoid blocking the user
      setGeneratedSuggestions((prev) => prev.filter((_, i) => i !== replaceIndex));
    }
  };

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



  const budgetOptions = [
    { value: 'Free', label: 'Free', icon: null, color: 'text-white' },
    { value: '$', label: 'Inexpensive', icon: DollarSign, color: 'text-white' },
    { value: '$$', label: 'Moderate', icon: DollarSign, color: 'text-white' },
    { value: '$$$', label: 'Pricey', icon: DollarSign, color: 'text-white' },
    { value: 'Any', label: 'No Budget Limit', icon: DollarSign, color: 'text-white' }
  ];



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
          budget: formData.budget,
          radius: formData.radius,
          groupSize: formData.groupSize,
          suggestionCount: formData.suggestionCount,
          lat: coords?.lat,
          lng: coords?.lng,
          excludeKeys: exclude.names,
          excludePlaceIds: exclude.ids
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
        title: `AI Suggestions: ${formData.prompt || 'Activity'}`,
        description: `Based on your preferences: ${formData.budget === 'Any' ? 'No budget limit' : formData.budget + ' budget'}, ${formData.radius}km radius, ${formData.groupSize} people`,
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

      // Create related message in group chat (only if user is a group member)
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        const isMember = groupSnap.exists() && Array.isArray(groupSnap.data()?.members) && groupSnap.data().members.includes(user.uid);
        if (isMember) {
          await addDoc(collection(db, 'groups', groupId, 'messages'), {
            type: 'ai_suggestions',
            pollId: pollRef.id,
            content: `🤖 AI Suggestions: ${(formData.prompt || 'Activity')} - ${generatedSuggestions.length} options found`,
            senderId: user.uid,
            senderName: user.displayName || user.email || 'User',
            timestamp: serverTimestamp(),
            groupId,
          });
        } else {
          console.warn('Skipping chat message: user is not a member of this group');
        }
      } catch (e) {
        console.warn('Non-blocking: failed to post chat message', e);
      }
      
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
                      ? 'bg-content-secondary border-content-secondary text-white'
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
                    {suggestion.reason && (
                      <p className="text-xs text-white/60 mt-1 italic">Why: {suggestion.reason}</p>
                    )}
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
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await replaceWithAlternative(index, suggestion);
                      }}
                      className="px-2 py-1 rounded bg-white/10 text-white border border-white/20 text-xs hover:bg-white/20"
                    >
                      Not this
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
              className="flex-1 py-3 px-6 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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