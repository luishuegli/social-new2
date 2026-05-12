# Firestore Permissions Error - Fixed

## Problem

You were getting "Missing or insufficient permissions" errors when creating posts.

## Root Cause

The Firestore security rule checks:
```javascript
allow create: if isAuthenticated() && 
  request.resource.data.authorId == request.auth.uid;
```

The issue was that `user.uid` from `useAuth()` might not match `request.auth.uid` in Firestore rules because:
1. `user` is an `ExtendedUser` object that may have a different structure
2. The `uid` property might not be properly synced with Firebase Auth

## Solution

Changed post creation to use `firebaseUser.uid` instead of `user.uid`:

**Before:**
```typescript
const { user } = useAuth();
const postDoc = {
  authorId: user.uid, // ❌ Might not match request.auth.uid
  // ...
};
```

**After:**
```typescript
const { user, firebaseUser } = useAuth();
const userId = firebaseUser.uid; // ✅ Matches request.auth.uid
const postDoc = {
  authorId: userId, // ✅ Correct UID
  // ...
};
```

## Files Fixed

1. ✅ `src/app/posts/create/page.tsx` - Regular post creation
2. ✅ `src/app/posts/live/create/page.tsx` - Live post creation

## Why This Works

- `firebaseUser` is the actual Firebase Auth `User` object
- `firebaseUser.uid` is guaranteed to match `request.auth.uid` in Firestore rules
- This ensures the security rule check passes: `request.resource.data.authorId == request.auth.uid`

## Testing

After this fix, post creation should work without permission errors. The Firestore rule will correctly validate that:
1. User is authenticated ✅
2. `authorId` matches the authenticated user's UID ✅

## Additional Notes

- The `firebaseUser` is already exported from `useAuth()` (line 199 in AuthContext.tsx)
- This is the correct way to get the Firebase Auth UID for Firestore operations
- Always use `firebaseUser.uid` when you need to match `request.auth.uid` in security rules


