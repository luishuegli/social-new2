'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, MessageSquare, CalendarPlus } from 'lucide-react';

export default function GroupCard({ group }) {
  // Take the first 3-4 members for the stacked avatars
  const displayMembers = group.members?.slice(0, 4) || [];

  // Format the date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Truncate description to a sensible length (160 characters for standard cards)
  const truncateDescription = (text, maxLength = 160) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  // Truncate activity title to fit nicely (60 characters for activity titles)
  const truncateActivityTitle = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="group liquid-glass p-6 transition-transform hover:-translate-y-1 cursor-pointer flex flex-col">
      {/* Card Header */}
      <div className="relative flex justify-between items-start mb-4">
        {/* Left Side - Group Name */}
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-lg font-bold text-content-primary line-clamp-2 leading-tight">
            {group.name}
          </h3>
        </div>
        
        {/* Right Side - Stacked Avatars */}
        <div className="flex items-center flex-shrink-0">
          <div className="flex">
            {displayMembers.map((member, index) => (
              <Image
                key={index}
                src={member.avatarUrl || '/api/placeholder/32/32'}
                alt="Member avatar"
                width={32}
                height={32}
                className={`rounded-full border-2 border-background-secondary ${
                  index > 0 ? '-ml-3' : ''
                }`}
                style={{ zIndex: displayMembers.length - index }}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions - Hover to Reveal */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Go to chat for group:', group.id);
            }}
            className="w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-content-primary hover:bg-black/80 transition-colors"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Plan activity for group:', group.id);
            }}
            className="w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-content-primary hover:bg-black/80 transition-colors"
            title="Plan Activity"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body - Flexible Description Area */}
      <p className="text-content-secondary text-sm leading-relaxed line-clamp-3 flex-grow my-4">
        {truncateDescription(group.description, 160)}
      </p>

      {/* Card Footer - Activity Status */}
      <div className="mt-auto">
        {group.nextActivity ? (
          <div className="border-t border-border-separator pt-4 space-y-3">
            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-content-primary font-medium leading-tight mb-1">
                  {truncateActivityTitle(group.nextActivity.title, 60)}
                </div>
                <div className="text-xs text-content-secondary">
                  {formatDate(group.nextActivity.date)}
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log('Join activity for group:', group.id, 'activity:', group.nextActivity.id);
              }}
              className="w-full border-2 border-support-success text-support-success py-2 px-4 rounded-full font-medium hover:bg-support-success hover:text-content-primary transition-all duration-200 text-sm"
            >
              Join
            </button>
          </div>
        ) : (
          <div className="pt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log('Plan activity for group:', group.id);
              }}
              className="w-full border-2 border-accent-primary text-accent-primary py-2 px-4 rounded-full font-medium hover:bg-accent-primary hover:text-content-primary transition-all duration-200 text-sm"
            >
              Plan Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}