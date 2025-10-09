# The Compass Social Engine - Implementation Guide

## 🧭 Overview

The Compass is a sophisticated social discovery engine that uses a dual-brain algorithm combining DNA-based matching with real-time preference learning to connect people meaningfully. This document outlines the complete implementation and deployment process.

## 🏗️ System Architecture

### Core Components

1. **Data Models** (`src/app/types/firestoreSchema.ts`)
   - UserProfile with DNA and Compass systems
   - CoreInterest with passion levels
   - SwipeLog for tracking user actions
   - MatchResult for client-safe profiles

2. **Vector Processing** (`src/lib/vectorUtils.ts`)
   - 128-dimension preference vectors
   - DNA-to-vector conversion
   - Cosine similarity calculations
   - Real-time vector updates

3. **Backend APIs**
   - `/api/compass/discover` - Main discovery endpoint with dual-brain algorithm
   - `/api/compass/log-swipe` - Records user actions and manages tokens
   - `/api/compass/initialize-vector` - Sets up new user vectors

4. **Cloud Functions** (`functions/src/compassLearning.ts`)
   - Real-time preference vector updates on swipe
   - Daily connection token refresh
   - Learning metrics tracking

5. **Frontend Components**
   - Compass Hub (`src/app/compass/page.tsx`)
   - Discovery Card Deck with swipe mechanics
   - Story Cards with frictionless icebreakers
   - Interest Channels for filtering
   - Enhanced onboarding flow

## 🚀 Deployment Guide

### Prerequisites

1. **Firebase Project Setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   ```

2. **Environment Variables**
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
   FIREBASE_ADMIN_PRIVATE_KEY=your-private-key
   ```

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   npm install react-tinder-card
   ```

2. **Create Firestore Indexes**
   Add to `firestore.indexes.json`:
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "users",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "compass.discoverable", "order": "ASCENDING" },
           { "fieldPath": "dna.coreInterests", "arrayConfig": "CONTAINS" },
           { "fieldPath": "compass.lastActiveTimestamp", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

3. **Deploy Firestore Rules**
   Update `firestore.rules`:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Swipe logs are write-only from authenticated users
       match /swipe_log/{document} {
         allow read: if false;
         allow create: if request.auth != null;
       }
       
       // Interests are readable by all authenticated users
       match /interests/{document} {
         allow read: if request.auth != null;
         allow write: if false; // Admin only via scripts
       }
       
       // Users can read their own profile and discoverable profiles
       match /users/{userId} {
         allow read: if request.auth != null && 
           (request.auth.uid == userId || resource.data.compass.discoverable == true);
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Seed Interests Collection**
   ```bash
   # Update service account path in scripts/seedInterests.js
   node scripts/seedInterests.js
   ```

5. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

6. **Deploy Application**
   ```bash
   npm run build
   npm run deploy  # Or deploy to Vercel/Netlify
   ```

## 🔧 Configuration

### Algorithm Parameters

Adjust in `/api/compass/discover/route.ts`:
- `LONG_TERM_WEIGHT = 0.65` - DNA compatibility weight
- `SHORT_TERM_WEIGHT = 0.35` - Preference vector weight
- `LEARNING_RATE = 0.05` - How fast preferences adapt
- `CANDIDATE_POOL_SIZE = 200` - Initial candidate fetch size
- `SEEN_COOLDOWN_DAYS = 7` - Days before re-showing profiles

### Token System

Configure in Cloud Functions:
- `DAILY_TOKEN_REFRESH = 3` - Tokens added daily
- `MAX_TOKENS = 10` - Maximum token cap
- `INITIAL_CONNECTION_TOKENS = 10` - New user tokens

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Engagement Metrics**
   - Swipe rates (connect vs skip)
   - Connection request acceptance rate
   - Messages sent post-connection
   - Time to first real-world meetup

2. **Algorithm Performance**
   - Average match score distribution
   - Preference vector convergence rate
   - DNA vs preference score correlation

3. **System Health**
   - API response times
   - Cloud Function execution times
   - Vector update success rate

### Firestore Collections for Analytics

- `compass_metrics` - Learning algorithm performance
- `compass_errors` - System error logging

## 🎯 Usage Flow

### User Journey

1. **Onboarding**
   - Username setup
   - Select archetype (Creator/Explorer/Organizer/Participant)
   - Choose 3+ interests with passion levels
   - Set social tempo and connection intent
   - Select languages

2. **Discovery**
   - View Daily Top Pick
   - Browse through Story Cards
   - Use Interest Channels to filter
   - Swipe right to connect (costs 1 token)
   - Swipe left to skip

3. **Connection**
   - Use frictionless icebreakers
   - Send custom messages
   - Transition to real-world meetups

## 🔍 Testing Checklist

- [ ] User can complete full onboarding flow
- [ ] Preference vector initializes correctly
- [ ] Discovery API returns diverse matches
- [ ] Swipe actions update preference vector
- [ ] Connection tokens decrement properly
- [ ] Daily token refresh works
- [ ] Interest filtering functions correctly
- [ ] Story Cards display all profile data
- [ ] Icebreaker buttons work
- [ ] Seen profiles aren't reshown within cooldown

## 🚨 Common Issues & Solutions

### Issue: "No matches available"
**Solution**: Check if interests collection is seeded and users have completed onboarding

### Issue: "Authentication failed" errors
**Solution**: Verify Firebase Admin credentials and auth token generation

### Issue: Preference vector not updating
**Solution**: Check Cloud Function logs and ensure swipe_log writes are successful

### Issue: High latency on discovery
**Solution**: Ensure Firestore indexes are created and deployed

## 📈 Future Enhancements

1. **Advanced Features**
   - Location-based filtering with geohashing
   - Group discovery for shared activities
   - Event-based matching
   - Personality quiz integration

2. **Algorithm Improvements**
   - Multi-armed bandit exploration
   - Contextual bandits for time-based preferences
   - Collaborative filtering
   - Graph-based recommendations

3. **Gamification**
   - Achievement system
   - Streak bonuses
   - Referral rewards
   - Premium token packages

## 📝 Notes

- The system is designed to handle 1M+ users with proper indexing
- All sensitive operations use Firebase Admin SDK
- Client never directly modifies preference vectors
- The dual-brain approach balances exploration and exploitation

## 🤝 Support

For issues or questions about The Compass implementation, refer to:
- Firebase documentation: https://firebase.google.com/docs
- Next.js documentation: https://nextjs.org/docs
- This implementation guide

---

**Built with intentionality to cure loneliness, one meaningful connection at a time.** 🧭✨
