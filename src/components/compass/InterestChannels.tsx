'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';
import { Interest } from '@/app/types/firestoreSchema';
import { Hash, TrendingUp, Users, Sparkles, X } from 'lucide-react';

interface InterestChannelsProps {
  onSelectInterest: (interest: string | null) => void;
  selectedInterest: string | null;
  isEmbedded?: boolean;
}

export default function InterestChannels({ 
  onSelectInterest, 
  selectedInterest,
  isEmbedded = false
}: InterestChannelsProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const interestsQuery = query(collection(db, 'interests'), limit(20));
        const snapshot = await getDocs(interestsQuery);
        const interestData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Interest));
        setInterests(interestData);
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sports':
        return '⚽';
      case 'gaming':
        return '🎮';
      case 'music':
        return '🎵';
      case 'food':
        return '🍳';
      case 'arts':
        return '🎨';
      case 'tech':
        return '💻';
      case 'outdoor':
        return '🏔️';
      case 'social':
        return '🎉';
      default:
        return '✨';
    }
  };

  const displayedInterests = showAll ? interests : interests.slice(0, 8);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex space-x-2 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "" : "liquid-glass border-b border-gray-200/30 dark:border-gray-700/30"}>
      <div className={isEmbedded ? "" : "container mx-auto px-6 py-4"}>
        <div className="flex items-center space-x-6">
          {/* All Matches Button */}
          <button
            onClick={() => onSelectInterest(null)}
            className={`
              flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
              ${!selectedInterest 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md border border-white/20' 
                : 'liquid-glass text-content-primary hover:opacity-80 border border-gray-200/30 dark:border-gray-700/30'
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">All Matches</span>
          </button>

          {/* Interest Channels */}
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {displayedInterests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => onSelectInterest(`#${interest.id}`)}
                className={`
                  flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                  ${selectedInterest === `#${interest.id}` 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <span>{getCategoryIcon(interest.category)}</span>
                <span className="font-medium">{interest.displayName}</span>
                {interest.type === 'in-person' && (
                  <Users className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>

          {/* Show More/Less Button */}
          {interests.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex-shrink-0 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              {showAll ? 'Show Less' : `+${interests.length - 8} more`}
            </button>
          )}

          {/* Clear Filter */}
          {selectedInterest && (
            <button
              onClick={() => onSelectInterest(null)}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
