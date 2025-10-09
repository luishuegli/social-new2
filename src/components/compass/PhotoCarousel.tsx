'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DiscoveryPhoto } from '@/app/types/firestoreSchema';

interface PhotoCarouselProps {
  photos: DiscoveryPhoto[];
  userId: string;
  userName: string;
  className?: string;
}

export default function PhotoCarousel({ 
  photos, 
  userId, 
  userName, 
  className = '' 
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-advance photos every 4 seconds if there are multiple photos
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [photos.length]);

  const nextPhoto = () => {
    if (photos.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevPhoto = () => {
    if (photos.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPhoto = (index: number) => {
    if (photos.length <= 1 || isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (!photos || photos.length === 0) {
    // Fallback to default avatar if no photos
    return (
      <div className={`relative h-80 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center ${className}`}>
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl border-4 border-white/80 dark:border-gray-700/80">
          <span className="text-4xl text-white font-bold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-80 overflow-hidden ${className}`}>
      {/* Photo Container */}
      <div className="relative w-full h-full">
        {photos.map((photo, index) => (
          <div
            key={`${photo.url}-${index}`}
            className={`absolute inset-0 transition-opacity duration-300 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={photo.url}
              alt={`${userName} photo ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar on image load error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-avatar');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
            {/* Fallback avatar for broken images */}
            <div className="fallback-avatar absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center" style={{ display: 'none' }}>
              <span className="text-4xl text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevPhoto}
            disabled={isTransitioning}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 liquid-glass rounded-full border border-white/20 dark:border-gray-700/20 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-content-primary" />
          </button>
          
          <button
            onClick={nextPhoto}
            disabled={isTransitioning}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 liquid-glass rounded-full border border-white/20 dark:border-gray-700/20 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-content-primary" />
          </button>
        </>
      )}

      {/* Photo Indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              disabled={isTransitioning}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white shadow-lg'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Photo Counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="liquid-glass rounded-full px-3 py-1 border border-white/20 dark:border-gray-700/20">
            <span className="text-sm font-medium text-content-primary">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
