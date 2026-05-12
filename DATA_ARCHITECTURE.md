# Data Architecture - Single Source of Truth

## Overview

This document describes the data architecture for The Social Portfolio app, emphasizing a **single source of truth** for all user data, including profile pictures.

## Core Principle: Single Source of Truth

**All user data (name, avatar, profile picture) is stored ONLY in the `users` collection in Firestore.**

- ✅ **DO**: Store only `authorId` in posts/comments/activities
- ✅ **DO**: Always fetch user data from `users` collection when displaying
- ❌ **DON'T**: Store `authorName` or `authorAvatar` in posts/comments
- ❌ **DON'T**: Denormalize user data for "performance"

## Profile Picture Storage

### Where Profile Pictures Are Stored

1. **File Storage**: Firebase Storage
   - Path: `profile-pictures/{userId}/{timestamp}_{filename}`
   - Optimized: Resized to 400x400px, compressed to JPEG 85% quality
   - Thumbnail: 150x150px version also created

2. **URL Storage**: Firestore `users` collection
   - Field: `users/{userId}.profilePictureUrl`
   - This is the **single source of truth** for profile picture URLs

### How Profile Pictures Are Fetched

**Always use the centralized `userData` utility:**

```typescript
import { getUserData, getUsersData } from '@/lib/userData';

// Single user
const user = await getUserData(userId);
const avatarUrl = user?.profilePictureUrl || '';

// Multiple users (batch fetch)
const usersMap = await getUsersData([userId1, userId2, userId3]);
const avatarUrl = usersMap.get(userId1)?.profilePictureUrl || '';
```

## Data Structure

### Users Collection

```typescript
users/{userId} {
  uid: string;
  displayName: string;
  username: string;
  profilePictureUrl: string; // Single source of truth
  bio?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Posts Collection

```typescript
posts/{postId} {
  authorId: string; // ✅ Only store ID
  // ❌ DO NOT store: authorName, authorAvatar
  
  activityTitle: string;
  activityCategory: string;
  description: string;
  imageUrl?: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
  likes: number;
  comments: number;
}
```

### Comments Subcollection

```typescript
posts/{postId}/comments/{commentId} {
  authorId: string; // ✅ Only store ID
  // ❌ DO NOT store: authorName, authorAvatar
  
  text: string;
  createdAt: Timestamp;
}
```

## Fetching User Data

### Client-Side (React Components)

```typescript
import { getUserData, getUsersData } from '@/lib/userData';

// Single user
const user = await getUserData(userId);
if (user) {
  const avatar = user.profilePictureUrl || '';
  const name = user.displayName || 'User';
}

// Multiple users (batch fetch - more efficient)
const userIds = ['user1', 'user2', 'user3'];
const usersMap = await getUsersData(userIds);
const user1 = usersMap.get('user1');
```

### Server-Side (API Routes)

```typescript
import { getUserDataAdmin, getUsersDataAdmin } from '@/lib/userData';

// Single user
const user = await getUserDataAdmin(userId);

// Multiple users (batch fetch)
const userIds = ['user1', 'user2', 'user3'];
const usersMap = await getUsersDataAdmin(userIds);
```

## Benefits of This Architecture

1. **Consistency**: Profile picture updates are immediately reflected everywhere
2. **Single Source of Truth**: No data duplication or sync issues
3. **Efficiency**: Batch fetching reduces Firestore reads
4. **Maintainability**: One place to update user data logic
5. **Cacheable**: User data can be cached (5-minute TTL in utility)

## Migration

If you have existing denormalized data, run the migration script:

```bash
# POST /api/migrate-remove-denormalized-user-data
# Requires: Authorization header with admin token
```

This will:
- Remove `authorName` and `authorAvatar` from all posts
- Remove `authorName` and `authorAvatar` from all comments
- Keep only `authorId` references

## Performance Considerations

### Batch Fetching

The `userData` utility automatically batches fetches:
- Handles Firestore's 10-item `in` query limit
- Caches results for 5 minutes
- Reduces redundant reads

### Caching

User data is cached in-memory:
- Cache TTL: 5 minutes
- Automatically cleared on page refresh
- Can be manually cleared: `clearUserCache(userId)`

## Best Practices

1. **Always use the utility**: Never fetch user data directly from Firestore
2. **Batch when possible**: Use `getUsersData()` for multiple users
3. **Handle missing users**: Always provide fallback values
4. **Clear cache after updates**: Call `clearUserCache()` after profile updates

## Example: Displaying Post with Author

```typescript
// ❌ BAD: Using denormalized data
const post = await getPost(postId);
const authorName = post.authorName; // May be stale!
const authorAvatar = post.authorAvatar; // May be stale!

// ✅ GOOD: Fetching from users collection
const post = await getPost(postId);
const author = await getUserData(post.authorId);
const authorName = author?.displayName || 'User';
const authorAvatar = author?.profilePictureUrl || '';
```

## Example: Displaying Multiple Posts

```typescript
// ✅ GOOD: Batch fetch all authors
const posts = await getPosts();
const authorIds = [...new Set(posts.map(p => p.authorId))];
const authorsMap = await getUsersData(authorIds);

const postsWithAuthors = posts.map(post => ({
  ...post,
  authorName: authorsMap.get(post.authorId)?.displayName || 'User',
  authorAvatar: authorsMap.get(post.authorId)?.profilePictureUrl || '',
}));
```

## Group Data

### Where Groups Are Stored

**Groups collection**: Firestore `groups/{groupId}`
- Field: `groups/{groupId}.groupName` (or `name`)
- Field: `groups/{groupId}.profilePictureUrl` (or `avatar`)
- Field: `groups/{groupId}.description`

### How Groups Are Fetched

**Always use the centralized `groupData` utility:**

```typescript
import { getGroupData, getGroupsData } from '@/lib/groupData';

// Single group
const group = await getGroupData(groupId);
const groupName = group?.name || 'Group';

// Multiple groups (batch fetch)
const groupsMap = await getGroupsData([groupId1, groupId2, groupId3]);
const groupName = groupsMap.get(groupId1)?.name || 'Group';
```

### Posts Collection (Updated)

```typescript
posts/{postId} {
  authorId: string; // ✅ Only store ID
  groupId?: string; // ✅ Only store ID
  // ❌ DO NOT store: groupName, groupAvatar
  
  activityTitle: string; // ✅ Snapshot of activity at post time (intentional)
  activityCategory: string; // ✅ Snapshot of activity at post time (intentional)
  activityDate: string; // ✅ Snapshot of activity at post time (intentional)
  activityDescription: string; // ✅ Snapshot of activity at post time (intentional)
  
  description: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
  likes: number;
  comments: number;
}
```

**Note**: Activity data in posts is intentionally denormalized because posts are "activity-gated" snapshots. The post represents the activity as it was when posted, not a live reference.

### Activities Collection

```typescript
activities/{activityId} {
  groupId: string; // ✅ Only store ID
  // ❌ DO NOT store: groupName, groupAvatar
  
  title: string;
  description?: string;
  date: Timestamp;
  location?: string;
  status: 'planned' | 'active' | 'completed';
  participants: string[]; // Array of user IDs
}
```

## Summary

- **Profile pictures**: Stored in Firebase Storage, URL in `users` collection
- **User data**: Always fetch from `users` collection
- **Group data**: Always fetch from `groups` collection
- **Posts/Comments**: Only store `authorId` and `groupId`, never denormalize user/group names/avatars
- **Activity data in posts**: Intentionally denormalized (snapshot at post time)
- **Activities**: Only store `groupId`, fetch group data when needed
- **Use utilities**: Always use `userData` and `groupData` utility functions
- **Batch fetch**: Use batch functions for multiple users/groups
- **Cache**: Leverage built-in caching for performance

This architecture ensures data consistency, reduces storage costs, and makes the codebase more maintainable.
