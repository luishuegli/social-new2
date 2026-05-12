# Profile Preview Modal Implementation Guide

This guide documents the complete implementation of the Profile Preview Modal feature with connection request functionality.

## Overview

The Profile Preview Modal allows users to:
- View a quick preview of another user's profile
- Send connection requests with optional personalized messages
- Automatically detect and accept mutual matches
- Integrate seamlessly with the existing Compass discovery system

## Components Created

### 1. ProfilePreviewModal Component
**Location:** `src/components/compass/ProfilePreviewModal.tsx`

A reusable modal component that displays user profile information and handles connection requests.

**Features:**
- Liquid Glass aesthetic matching your app's design system
- Support for optional personalized messages
- Displays match score and shared interests
- Shows user DNA (archetype, social preferences, interests)
- Smooth animations and responsive design

**Props:**
```typescript
interface ProfilePreviewModalProps {
  user: Partial<UserProfile>;
  matchScore?: number;
  sharedInterests?: any[];
  onClose: () => void;
  onConnect: (userId: string, message?: string) => void;
}
```

**Usage Example:**
```tsx
import ProfilePreviewModal from '@/components/compass/ProfilePreviewModal';

const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);

// Show modal
<ProfilePreviewModal
  user={selectedUser}
  matchScore={85}
  sharedInterests={sharedInterestsList}
  onClose={() => setSelectedUser(null)}
  onConnect={handleConnect}
/>
```

### 2. Connection API Endpoint
**Location:** `src/app/api/connect/route.ts`

A dedicated API endpoint for handling connection requests.

**Features:**
- POST: Create connection requests with optional messages
- GET: Check connection status between users
- Automatic mutual match detection and acceptance
- Proper authentication and validation
- Prevents duplicate connection requests

**POST Request:**
```typescript
// POST /api/connect
{
  targetUserId: string;
  message?: string;
}

// Response
{
  success: boolean;
  message: string;
  connectionId: string;
  mutualMatch?: boolean;
}
```

**GET Request:**
```typescript
// GET /api/connect?targetUserId=xxx
// Response
{
  success: boolean;
  isConnected: boolean;
  isPending: boolean;
  status: 'none' | 'pending' | 'accepted';
  receivedRequest?: boolean;
}
```

## Updated Components

### 1. log-swipe API Route
**Location:** `src/app/api/compass/log-swipe/route.ts`

**Changes:**
- Now accepts optional `message` parameter
- Creates connection requests in `connections` collection
- Handles mutual match detection
- Automatically accepts connections when both users swiped right

### 2. Compass Page
**Location:** `src/app/compass/page.tsx`

**Changes:**
- `handleAction` now accepts optional `message` parameter
- Passes message to the API when connecting

### 3. DiscoveryCardDeck Component
**Location:** `src/components/compass/DiscoveryCardDeck.tsx`

**Changes:**
- `onSwipe` prop now accepts optional `message` parameter
- Properly forwards messages through the connection flow

## Database Structure

### Connections Collection
```typescript
// Collection: connections
{
  from: string;              // User ID who sent the request
  to: string;                // User ID who received the request
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;    // Optional personalized message
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  updatedAt: Timestamp;
}
```

### Users Collection Updates
```typescript
// Existing fields enhanced:
{
  pendingRequests: string[];  // Array of user IDs with pending requests
  connections: string[];      // Array of accepted connection user IDs
}
```

## Integration Flow

### Current Compass Discovery Flow
The existing StoryCard component already supports messages! The flow works as follows:

1. User views profile in DiscoveryCardDeck
2. User can add optional message in StoryCard
3. User clicks "Connect" button
4. Message is passed through to log-swipe API
5. Connection request is created in database
6. Target user receives notification (via pendingRequests array)

### Using ProfilePreviewModal (Alternative/Additional Flow)
You can add the ProfilePreviewModal for quick profile previews anywhere in your app:

```tsx
// Example: Add to a user list or search results
import ProfilePreviewModal from '@/components/compass/ProfilePreviewModal';

const UserList = () => {
  const [previewUser, setPreviewUser] = useState(null);

  const handleConnect = async (userId: string, message?: string) => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId: userId, message }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.mutualMatch) {
        alert('Mutual match! You are now connected!');
      } else {
        alert('Connection request sent!');
      }
    }
  };

  return (
    <>
      {users.map(user => (
        <div key={user.id} onClick={() => setPreviewUser(user)}>
          {user.username}
        </div>
      ))}
      
      {previewUser && (
        <ProfilePreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
          onConnect={handleConnect}
        />
      )}
    </>
  );
};
```

## Mutual Match Feature

The system automatically detects and accepts mutual matches:

1. **User A** swipes right on **User B** → Creates pending connection
2. **User B** swipes right on **User A** → System detects mutual interest
3. Connection is automatically accepted for both users
4. Both users are added to each other's `connections` array
5. Both users are removed from `pendingRequests` arrays

## Security & Validation

### Authentication
All API endpoints require valid Firebase ID tokens:
```typescript
Authorization: Bearer <firebase-id-token>
```

### Validation Checks
- ✅ User cannot connect with themselves
- ✅ Duplicate connection requests are prevented
- ✅ Connection token limits are enforced
- ✅ Proper error messages for all edge cases

## Testing Checklist

### Backend Testing
- [ ] POST /api/connect creates connection request
- [ ] GET /api/connect returns correct status
- [ ] Mutual match detection works
- [ ] Connection tokens are decremented
- [ ] Duplicate requests are prevented
- [ ] Messages are stored correctly

### Frontend Testing
- [ ] ProfilePreviewModal displays correctly
- [ ] Modal can be opened and closed
- [ ] Message textarea works
- [ ] Connect button sends request
- [ ] Loading states work properly
- [ ] Error handling displays properly

### Integration Testing
- [ ] Compass page connects with messages
- [ ] StoryCard passes messages correctly
- [ ] DiscoveryCardDeck forwards messages
- [ ] Notifications work for pending requests
- [ ] Connection list updates after acceptance

## Next Steps

### Recommended Enhancements
1. **Notifications System**: Create a notifications component to show incoming connection requests
2. **Connection Management Page**: Build a page to manage connections and pending requests
3. **Message Threading**: Allow users to start conversations with accepted connections
4. **Rich Messages**: Add support for GIFs, emojis, or media in connection requests
5. **Connection Analytics**: Track successful connection rates and match quality

### Example: Building a Connections Page
```tsx
// pages/connections/page.tsx
const ConnectionsPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  // Fetch pending requests and connections
  // Display them in tabs
  // Allow accepting/rejecting requests
};
```

## Troubleshooting

### Common Issues

**Issue:** Connection request not appearing in pendingRequests
- **Solution:** Check Firestore security rules allow writes to users collection

**Issue:** Modal not displaying
- **Solution:** Ensure proper z-index and parent container positioning

**Issue:** Message not being saved
- **Solution:** Verify message parameter is being passed through all layers

**Issue:** Mutual match not auto-accepting
- **Solution:** Check that both users have proper connection documents in Firestore

## Support

For questions or issues:
1. Check console logs for detailed error messages
2. Verify Firestore indexes are created (connections collection needs indexes)
3. Ensure Firebase authentication is working properly
4. Review the implementation guide above

## Summary

✅ **ProfilePreviewModal Component** - Beautiful, responsive modal with Liquid Glass aesthetic
✅ **Connection API** - Robust backend for handling connection requests with messages
✅ **Mutual Match Detection** - Automatic connection acceptance for mutual interests
✅ **Full Integration** - Seamlessly works with existing Compass discovery system
✅ **Type Safety** - Full TypeScript support throughout
✅ **Error Handling** - Comprehensive validation and error messages

Your profile preview modal system is now fully implemented and ready to use!

