import { Timestamp } from 'firebase/firestore';

// Define a type for a single interest object
export interface CoreInterest {
  tag: string;       // Unique identifier, e.g., '#golf'
  passion: 'casual' | 'passionate' | 'pro'; // The user's intensity for this interest
  type: 'in-person' | 'online'; // The nature of the interest, fetched from the 'interests' collection
}

// Photo structure for discovery cards
export interface DiscoveryPhoto {
  url: string;
  isProfilePhoto: boolean; // true if it's from profile photos, false if discovery-only
  profilePhotoId?: string; // reference to profile photo if isProfilePhoto is true
  uploadedAt: Timestamp;
  order: number; // for ordering photos in discovery card
}

// The main user profile structure with DNA and Compass systems
export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string;
  displayName?: string;
  bio?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Photo management for discovery
  photos?: {
    profile: string[]; // URLs of profile photos
    discovery: DiscoveryPhoto[]; // Photos specifically for discovery cards
    discoverySettings: {
      selectedProfilePhotos: string[]; // Profile photo URLs selected for discovery
      maxPhotos: number; // Maximum photos to show in discovery (default 6)
    };
  };

  dna: {
    // --- The Stable Identity (Set once, updated rarely) ---
    archetype: 'creator' | 'explorer' | 'organizer' | 'participant';
    coreInterests: CoreInterest[];
    connectionIntent: 'spontaneous' | 'planned' | 'both';
    socialTempo: 'one-on-one' | 'small-group' | 'large-group';
    languages: string[]; // ISO 639-1 codes, e.g., ['en', 'de']
    lastKnownLocation?: {
      geohash: string;
      lat: number;
      lon: number;
    };
  };

  compass: {
    // --- The Adaptive Identity (Constantly learning) ---
    preferenceVector: number[]; // A 128-dimension float array. Represents learned tastes.
    
    // --- System State & Mechanics ---
    discoverable: boolean;
    lastActiveTimestamp: Timestamp;
    seenProfileIds: { [key: string]: Timestamp }; // Maps profileId to the timestamp it was last shown
    connectionTokens: {
      count: number;
      refreshedAt: Timestamp;
    };
  };

  // Legacy/existing fields (keeping for compatibility)
  groups?: string[];
  connections?: string[];
  pendingRequests?: string[];
}

// Interest collection schema
export interface Interest {
  id?: string; // Document ID will be the tag name
  displayName: string;
  type: 'in-person' | 'online';
  category: string;
}

// Swipe log collection schema
export interface SwipeLog {
  swiperId: string;
  targetId: string;
  action: 'connect' | 'skip';
  timestamp: Timestamp;
}

// Match result returned by the discovery API
export interface MatchResult {
  profile: Partial<UserProfile>; // Client-safe version
  score: number;
  sparkTitle?: string; // Generated title for the match
  sharedInterests?: CoreInterest[];
}