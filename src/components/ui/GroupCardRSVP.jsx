'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Check, Plus } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GroupCardRSVP({ group }) {
  const { user } = useAuth?.() || { user: null };
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has already joined the activity
  const hasJoined = group?.nextActivity?.participants?.includes(user?.uid) || 
                   group?.nextActivity?.joined || false;

  const handleRSVP = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setError('Please sign in to RSVP');
      return;
    }

    if (!group?.nextActivity?.id) {
      setError('Activity not available');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Call the RSVP API endpoint
      const response = await fetch('/api/rsvp-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: group.nextActivity.id,
          groupId: group.id,
          userId: user.uid,
          action: hasJoined ? 'leave' : 'join'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update RSVP');
      }

      // The parent component should handle the state update
      // For now, we'll show a success message
      console.log('RSVP updated successfully:', result);
      
    } catch (error) {
      console.error('RSVP error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to update RSVP';
      if (error.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to RSVP';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please try again';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Activity not found';
      }
      
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // Don't render if no next activity
  if (!group?.nextActivity) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Participants preview */}
      {Array.isArray(group.nextActivity.participants) && group.nextActivity.participants.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.nextActivity.participants.slice(0,6).map((p, idx) => (
              <div key={p.id || p.uid || idx} className="w-7 h-7 rounded-full border-2 border-background-primary overflow-hidden bg-background-secondary flex items-center justify-center" style={{ zIndex: 6 - idx }}>
                {p.avatarUrl ? (
                  <Image src={p.avatarUrl} alt={p.name || 'User'} width={28} height={28} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-[10px] font-semibold text-content-primary">{(p.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {group.nextActivity.participants.length > 6 && (
              <div className="w-7 h-7 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                <span className="text-[10px] font-semibold text-content-primary">+{group.nextActivity.participants.length - 6}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-content-secondary ml-2">{group.nextActivity.participants.length} going</div>
        </div>
      )}

      {/* RSVP Button */}
      <motion.button
        onClick={handleRSVP}
        disabled={isJoining || !user}
        whileHover={!isJoining ? { scale: 1.02 } : {}}
        whileTap={!isJoining ? { scale: 0.98 } : {}}
        className={`
          w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200
          ${hasJoined 
                             ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm' 
            : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
          }
          ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}
          ${!user ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center justify-center space-x-2">
          {isJoining ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Updating...</span>
            </>
          ) : hasJoined ? (
            <>
              <Check className="w-4 h-4" />
              <span>Going</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>RSVP</span>
            </>
          )}
        </div>
      </motion.button>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 text-center">
          {error}
        </p>
      )}

      {/* Sign in prompt */}
      {!user && (
        <p className="text-xs text-content-secondary text-center">
          Sign in to RSVP
        </p>
      )}
    </div>
  );
}
