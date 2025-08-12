// Firestore Data Schema as specified in the blueprint
// This defines the structure for all collections in the database

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: FirebaseFirestore.Timestamp;
  lastSeen: FirebaseFirestore.Timestamp;
  // Social Portfolio fields
  skills: string[];
  interests: string[];
  preferences: {
    activityTypes: string[];
    budget: string;
    radius: number;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  memberCount: number;
  isActive: boolean;
  // Group DNA fields
  dna: {
    averageStrategy: {
      activityTypes: string[];
      budget: string;
      radius: number;
    };
    leastMiseryStrategy: {
      activityTypes: string[];
      budget: string;
      radius: number;
    };
  };
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: FirebaseFirestore.Timestamp;
  lastActive: FirebaseFirestore.Timestamp;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: FirebaseFirestore.Timestamp;
  type: 'text' | 'poll_message' | 'image_poll' | 'ai_suggestions' | 'manual_poll';
  // For poll messages
  pollId?: string;
  pollData?: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: FirebaseFirestore.Timestamp;
  likes: number;
  comments: number;
  type: 'LivePost' | 'ItineraryPost';
  // For itinerary posts
  itineraryData?: {
    days: ItineraryDay[];
    totalDays: number;
    destination: string;
  };
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
  notes: string;
}

export interface ItineraryActivity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  createdBy: string;
  comments: ActivityComment[];
}

export interface ActivityComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  type: 'activity_poll' | 'image_poll' | 'ai_suggestions' | 'manual_poll';
  groupId: string;
  groupName: string;
  createdBy: string;
  createdByName: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  totalVotes: number;
  isActive: boolean;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  votes: number;
  voters: string[];
}

export interface ActivitySuggestion {
  id: string;
  userId: string;
  activityType: string;
  budget: string;
  radius: number;
  location: string;
  suggestions: SuggestionItem[];
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}

export interface SuggestionItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  priceLevel: string;
  distance: number;
  placeId?: string; // Google Places API ID
}

export interface VoteHistory {
  id: string;
  userId: string;
  pollId: string;
  selectedOption: string;
  activityType: string;
  groupId: string;
  timestamp: FirebaseFirestore.Timestamp;
  // For AI learning
  context: {
    budget: string;
    radius: number;
    groupSize: number;
    timeOfDay: string;
    dayOfWeek: string;
  };
}

// Collection paths and structure
export const COLLECTIONS = {
  USERS: 'users',
  GROUPS: 'groups',
  GROUP_MEMBERS: 'groups/{groupId}/members',
  GROUP_MESSAGES: 'groups/{groupId}/messages',
  POSTS: 'posts',
  POLLS: 'polls',
  ACTIVITY_SUGGESTIONS: 'activitySuggestions',
  VOTE_HISTORY: 'voteHistory'
} as const;

// Helper function to validate data against schema
export function validateUser(user: any): user is User {
  return (
    typeof user.uid === 'string' &&
    typeof user.email === 'string' &&
    typeof user.displayName === 'string' &&
    user.createdAt &&
    user.lastSeen
  );
}

export function validatePoll(poll: any): poll is Poll {
  return (
    typeof poll.id === 'string' &&
    typeof poll.title === 'string' &&
    typeof poll.type === 'string' &&
    Array.isArray(poll.options) &&
    poll.createdAt &&
    poll.expiresAt
  );
}

export function validateMessage(message: any): message is Message {
  return (
    typeof message.content === 'string' &&
    typeof message.senderId === 'string' &&
    typeof message.type === 'string' &&
    message.timestamp
  );
} 