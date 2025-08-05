// src/app/types.ts

// Base User/Member type
export interface BaseUser {
  id: string;
  name: string;
  avatarUrl: string;
}

// Group-related types
export interface Activity {
  id: string;
  title: string;
  date: string; // ISO string format
  location?: string;
  type?: string;
  joined?: boolean;
}

export interface LatestActivity {
  type: 'message' | 'post' | 'poll';
  author?: {
    name: string;
    avatarUrl: string;
  };
  content: string;
  timestamp: string;
  imageUrl?: string; // For posts
  pollQuestion?: string; // For polls
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
  members: BaseUser[]; // This will be populated
  joined?: boolean;
  nextActivity?: Activity;
  latestActivity?: LatestActivity;
  category?: string;
  theme?: {
    colors: {
      primary: string;
      secondary: string;
    };
  };
  isPinned?: boolean;
  coverImage?: string;
}

// Post types
export interface Post {
  id: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

// Conversation types
export interface LastMessage {
  content: string;
  timestamp: string;
  senderId: string;
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: LastMessage;
  unreadCount: number;
}

// Activity Poll types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ActivityPoll {
  id: string;
  groupName: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endDate: Date;
  isActive: boolean;
  userVoted?: boolean;
}

// Request types
export interface Request {
  id: string;
  type: string;
  title: string;
  description: string;
  requester: {
    id: string;
    name: string;
    avatar: string;
  };
  target: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: string;
  status: string;
}