'use client';

import React, { useState } from 'react';
import { Check, X, User } from 'lucide-react';
import { ConnectionRequest } from '@/app/hooks/useConnectionRequests';
import { formatDistanceToNow } from 'date-fns';

interface RequestCardProps {
  request: ConnectionRequest;
  onAccept: (connectionId: string) => Promise<void>;
  onDecline: (connectionId: string) => Promise<void>;
}

export default function RequestCard({ request, onAccept, onDecline }: RequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setAction('accept');
    
    try {
      await onAccept(request.id);
    } catch (error) {
      console.error('Failed to accept request:', error);
      setIsProcessing(false);
      setAction(null);
    }
  };

  const handleDecline = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setAction('decline');
    
    try {
      await onDecline(request.id);
    } catch (error) {
      console.error('Failed to decline request:', error);
      setIsProcessing(false);
      setAction(null);
    }
  };

  const timeAgo = request.createdAt 
    ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true })
    : '';

  return (
    <div className="liquid-glass rounded-xl p-6 border border-gray-200/20 dark:border-gray-700/20 transition-all">
      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {request.requesterInfo?.photoURL ? (
            <img
              src={request.requesterInfo.photoURL}
              alt={request.requesterInfo.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-content-primary truncate">
              {request.requesterInfo?.displayName || request.requesterInfo?.username || 'User'}
            </h3>
            {timeAgo && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {timeAgo}
              </span>
            )}
          </div>

          {request.requesterInfo?.username && request.requesterInfo.displayName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              @{request.requesterInfo.username}
            </p>
          )}

          {/* Message */}
          {request.message && (
            <div className="mb-4 p-3 liquid-glass rounded-lg border border-gray-200/20 dark:border-gray-700/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                "{request.message}"
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className={`
                flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
                ${isProcessing && action === 'accept'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-wait'
                  : 'bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 hover:opacity-90 shadow-lg border-2 border-gray-200/50 dark:border-gray-300/50'
                }
                ${isProcessing && action !== 'accept' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Check className="w-5 h-5" />
              <span>{isProcessing && action === 'accept' ? 'Accepting...' : 'Accept'}</span>
            </button>

            <button
              onClick={handleDecline}
              disabled={isProcessing}
              className={`
                flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
                ${isProcessing && action === 'decline'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-wait'
                  : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
                ${isProcessing && action !== 'decline' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <X className="w-5 h-5" />
              <span>{isProcessing && action === 'decline' ? 'Declining...' : 'Decline'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

