/**
 * Search-related TypeScript types and interfaces
 */

export interface SearchResult {
  id: string;
  type: 'user' | 'group' | 'activity';
  
  // User fields
  displayName?: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  
  // Group fields
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  memberCount?: number;
  
  // Activity fields
  activityTitle?: string;
  activityType?: string;
  location?: string;
  date?: string;
  
  // Search metadata
  relevanceScore: number;
  matchedField?: 'username' | 'displayName' | 'groupName' | 'description' | 'title';
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalCount?: number;
  timestamp?: number;
}

export interface SearchFilters {
  type?: 'user' | 'group' | 'activity' | 'all';
  location?: string;
  category?: string;
  minRelevance?: number;
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  userId?: string;
  timestamp: Date;
  clickedResult?: {
    id: string;
    type: string;
    position: number;
  };
  duration?: number;
}







