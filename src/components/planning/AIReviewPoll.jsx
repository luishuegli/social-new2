'use client';

import React from 'react';
import LiquidGlass from '../ui/LiquidGlass';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function AIReviewPoll({ suggestions, onCreatePoll, onRegenerate, isCreating }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <LiquidGlass className="p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <p className="text-neutral-400">No suggestions available</p>
        </div>
      </LiquidGlass>
    );
  }

  return (
    <LiquidGlass className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Review Your AI Suggestions</h2>
          <p className="text-neutral-400">
            Here are {suggestions.length} personalized activity suggestions for your group
          </p>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-neutral-300 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={onCreatePoll}
            disabled={isCreating}
            className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Poll...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Create Poll</span>
              </>
            )}
          </button>
          
          <button
            onClick={onRegenerate}
            disabled={isCreating}
            className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Info Message */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            These suggestions will be turned into a poll that your group can vote on
          </p>
        </div>
      </div>
    </LiquidGlass>
  );
}