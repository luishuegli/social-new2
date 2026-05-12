'use client';

import React from 'react';
import Link from 'next/link';
import { Users, User } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'user' | 'group';
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  memberCount?: number;
  relevanceScore: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultClick?: () => void;
}

export default function SearchResults({ 
  results, 
  isLoading = false,
  onResultClick 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 liquid-glass rounded-xl border border-border-separator shadow-lg max-h-96 overflow-y-auto z-50">
        <div className="p-6 text-center text-content-secondary">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-content-primary"></div>
          <p className="mt-2">Searching...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 liquid-glass rounded-xl border border-border-separator shadow-lg max-h-96 overflow-y-auto z-50">
      <div className="p-2">
        {results.map((result) => (
          <Link
            key={`${result.type}-${result.id}`}
            href={result.type === 'user' ? `/profile/${result.id}` : `/groups/${result.id}`}
            onClick={onResultClick}
            className="block"
          >
            {result.type === 'user' ? (
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-secondary transition-colors">
                {/* User Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-primary overflow-hidden">
                  {result.profilePictureUrl ? (
                    <img
                      src={result.profilePictureUrl}
                      alt={result.displayName || result.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-content-secondary" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-content-primary truncate">
                    {result.displayName || result.username}
                  </p>
                  <p className="text-sm text-content-secondary truncate">
                    @{result.username}
                  </p>
                </div>

                {/* User Badge */}
                <div className="flex-shrink-0">
                  <div className="px-2 py-1 rounded-md bg-background-secondary text-content-secondary text-xs font-medium">
                    User
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-secondary transition-colors">
                {/* Group Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent-primary overflow-hidden">
                  {result.groupAvatar ? (
                    <img
                      src={result.groupAvatar}
                      alt={result.groupName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-content-secondary" />
                    </div>
                  )}
                </div>

                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-content-primary truncate">
                    {result.groupName}
                  </p>
                  <p className="text-sm text-content-secondary truncate">
                    {result.memberCount ? `${result.memberCount} members` : 'Group'}
                    {result.description && ` • ${result.description}`}
                  </p>
                </div>

                {/* Group Badge */}
                <div className="flex-shrink-0">
                  <div className="px-2 py-1 rounded-md bg-background-secondary text-content-secondary text-xs font-medium">
                    Group
                  </div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Results count footer */}
      {results.length > 0 && (
        <div className="px-4 py-2 border-t border-border-separator bg-background-secondary/50 text-center text-sm text-content-secondary">
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}







