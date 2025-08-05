'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Calendar, Check, X } from 'lucide-react';
import LiquidGlass from './ui/LiquidGlass';

export default function RequestCard({ request, onAccept, onDecline }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getRequestIcon = (type) => {
    switch (type) {
      case 'group_invite':
        return <Users className="w-5 h-5 text-accent-primary" />;
      case 'join_request':
        return <Users className="w-5 h-5 text-support-warning" />;
      case 'activity_invite':
        return <Calendar className="w-5 h-5 text-support-success" />;
      default:
        return <Users className="w-5 h-5 text-content-secondary" />;
    }
  };

  const getRequestMessage = () => {
    switch (request.type) {
      case 'group_invite':
        return `You've been invited to join "${request.groupName}"`;
      case 'join_request':
        return `${request.fromUser.name} wants to join "${request.groupName}"`;
      case 'activity_invite':
        return `You've been invited to "${request.activityName}"`;
      default:
        return request.message || 'New request';
    }
  };

  const formatTimestamp = (date) => {
    if (!mounted || !date) return '';
    const now = new Date();
    const requestDate = new Date(date);
    const diffInHours = Math.floor((now - requestDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return requestDate.toLocaleDateString();
  };

  const handleAccept = (e) => {
    e.stopPropagation();
    onAccept?.(request.id);
  };

  const handleDecline = (e) => {
    e.stopPropagation();
    onDecline?.(request.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <LiquidGlass className="p-4 mb-3">
        <div className="flex items-start space-x-3">
          {/* Request Icon */}
          <div className="flex-shrink-0 mt-1">
            {getRequestIcon(request.type)}
          </div>

          {/* Request Content */}
          <div className="flex-1 min-w-0">
            {/* From User Info (for join requests) */}
            {request.fromUser && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden">
                  {request.fromUser.avatar ? (
                    <Image
                      src={request.fromUser.avatar}
                      alt={request.fromUser.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-content-primary">
                      {request.fromUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-content-primary">
                  {request.fromUser.name}
                </span>
              </div>
            )}

            {/* Request Message */}
            <p className="text-content-primary font-medium mb-2 leading-relaxed">
              {getRequestMessage()}
            </p>

            {/* Additional Info */}
            {request.description && (
              <p className="text-sm text-content-secondary mb-3 leading-relaxed">
                {request.description}
              </p>
            )}

            {/* Timestamp and Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-secondary">
                {formatTimestamp(request.timestamp)}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDecline}
                  className="flex items-center space-x-1 px-3 py-1.5 border-2 border-support-error text-support-error rounded-full text-sm font-medium hover:bg-support-error hover:text-content-primary transition-all duration-200"
                >
                  <X className="w-3 h-3" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={handleAccept}
                  className="flex items-center space-x-1 px-3 py-1.5 border-2 border-support-success text-support-success rounded-full text-sm font-medium hover:bg-support-success hover:text-content-primary transition-all duration-200"
                >
                  <Check className="w-3 h-3" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </LiquidGlass>
    </motion.div>
  );
}