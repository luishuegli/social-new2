'use client';

import React, { useState, useEffect } from 'react';
import AIPlannerForm from './AIPlannerForm';
import AIReviewPoll from './AIReviewPoll';
import { getAISuggestions } from '../../lib/aiPlanner';
import { handleCreatePoll } from '../../lib/pollHandler';

export default function AIPlannerFlow({ groupId, userId, userName, onPollCreated }) {
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'review', 'success'
  const [suggestions, setSuggestions] = useState(null);
  const [reviewSettings, setReviewSettings] = useState({ durationMinutes: 60 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-close modal after successful poll creation
  useEffect(() => {
    if (currentStep === 'success') {
      const timer = setTimeout(() => {
        if (onPollCreated) {
          onPollCreated();
        }
      }, 2000); // Auto-close after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [currentStep, onPollCreated]);

  const handleGenerateSuggestions = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiSuggestions = await getAISuggestions(formData, groupId);
      
      if (aiSuggestions && aiSuggestions.length > 0) {
        setSuggestions({ items: aiSuggestions });
        setReviewSettings({ durationMinutes: formData.durationMinutes || 60 });
        setCurrentStep('review');
      } else {
        setError('Failed to generate suggestions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePollClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await handleCreatePoll(suggestions.items, groupId, userId, userName, { durationMinutes: reviewSettings.durationMinutes });
      
      if (result.success) {
        setCurrentStep('success');
      } else {
        setError(result.message || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      setError('Failed to create poll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setSuggestions(null);
    setCurrentStep('form');
    setError(null);
  };

  const handleStartOver = () => {
    setSuggestions(null);
    setCurrentStep('form');
    setError(null);
  };

  const handleCloseModal = () => {
    if (onPollCreated) {
      onPollCreated();
    }
  };

  // Error display component
  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (currentStep === 'success') {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 text-center">
          <div className="text-green-400 text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Poll Created!</h2>
          <p className="text-neutral-300 mb-6">
            Your AI-generated activity suggestions have been posted as a poll. 
            Group members can now vote directly in the chat!
          </p>
          <div className="space-y-3">
            <button
              onClick={handleCloseModal}
              className="w-full px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 backdrop-blur-sm transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleStartOver}
              className="w-full px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Create Another Poll
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main flow
  return (
    <div className="space-y-6">
      {currentStep === 'form' && (
        <AIPlannerForm onGenerateSuggestions={handleGenerateSuggestions} />
      )}
      
      {currentStep === 'review' && suggestions && (
        <AIReviewPoll
          suggestions={suggestions.items}
          durationMinutes={reviewSettings.durationMinutes}
          onChangeDuration={(v) => setReviewSettings((s) => ({ ...s, durationMinutes: v }))}
          onCreatePoll={handleCreatePollClick}
          onRegenerate={handleRegenerate}
          isCreating={isLoading}
        />
      )}
    </div>
  );
}