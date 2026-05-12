# Data Inconsistency Fixes - Implementation Guide

**Date:** 2025-11-07  
**Status:** Ready for Implementation

---

## Summary of Issues Found

### Critical Issues

1. **Profile Picture Inconsistency**
   - Sidebar uses `user.profilePictureUrl` from AuthContext
   - Profile page uses `profile.photoURL` from useUserProfile hook
   - **Different fields = different images**

2. **Group Member Count Inconsistency**
   - Profile page shows: `counts?.groups || groups.length` (10 vs 5)
   - Different hooks calculate differently
   - **No single source of truth**

3. **Multiple Data Fetching Sources**
   - AuthContext fetches from Firestore
   - useUserProfile hook fetches from Firestore
   - dataService.ts fetches from Firestore
   - userData.ts fetches from Firestore
   - **5+ different places fetching same data**

4. **Multiple Caching Systems**
   - userData.ts has its own cache
   - dataService.ts has its own cache
   - **Caches don't sync = stale data**

5. **Field Name Inconsistencies**
   - `profilePictureUrl` vs `photoURL` vs `avatar`
   - `displayName` vs `name`
   - **Different components use different field names**

---

## Solution: Single Source of Truth

### Created Files

1. ✅ `src/hooks/useUserData.ts` - Unified user data hook
2. ✅ `src/hooks/useGroupMemberCount.ts` - Unified group member count hook
3. ✅ `src/lib/userDataMapper.ts` - Field name normalization

### Migration Steps

#### Step 1: Update Profile Page

**File:** `src/app/profile/[userId]/page.tsx`

**Before:**
```typescript
const { profile, counts } = useUserProfile(userId);
const { groups } = useUserGroups(userId);

const user = {
  name: profile?.username || profile?.displayName || 'User',
  avatar: profile?.photoURL || '', // ❌ Wrong field!
  stats: {
    groupsCount: counts?.groups || groups.length || 0, // ❌ Two sources!
  },
};
```

**After:**
```typescript
import { useUserData } from '@/hooks/useUserData';
import { useGroupMemberCount } from '@/hooks/useGroupMemberCount';
import { getProfilePictureUrl, getDisplayName } from '@/lib/userDataMapper';

const { user: profileData } = useUserData(userId);
const { groups } = useUserGroups(userId);
const groupMemberCount = useGroupMemberCount(groups[0]?.id); // Example

const user = {
  name: getDisplayName(profileData), // ✅ Normalized
  avatar: getProfilePictureUrl(profileData), // ✅ Always profilePictureUrl
  stats: {
    groupsCount: groups.length, // ✅ Single source
  },
};
```

---

#### Step 2: Update Sidebar

**File:** `src/app/components/sidebar/UserProfileSection.tsx`

**Before:**
```typescript
const profilePicture = user.profilePictureUrl || user.photoURL; // ⚠️ Fallback
const displayName = user.displayName || 'User';
```

**After:**
```typescript
import { getProfilePictureUrl, getDisplayName } from '@/lib/userDataMapper';

const profilePicture = getProfilePictureUrl(user); // ✅ Normalized
const displayName = getDisplayName(user); // ✅ Normalized
```

---

#### Step 3: Update AuthContext

**File:** `src/app/contexts/AuthContext.tsx`

**Before:**
```typescript
// Fetches user data from Firestore
const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
const userData = userDoc.data();
const extendedUser = {
  ...firebaseUser,
  profilePictureUrl: userData?.profilePictureUrl
} as ExtendedUser;
setUser(extendedUser);
```

**After:**
```typescript
// Keep only Firebase Auth user
// Components will use useUserData hook for profile data
setFirebaseUser(firebaseUser);
// Don't fetch Firestore data here - let components use useUserData
```

**Update components using AuthContext:**
```typescript
// Old
const { user } = useAuth();
const profilePicture = user.profilePictureUrl;

// New
const { firebaseUser } = useAuth();
const { user } = useUserData(firebaseUser?.uid);
const profilePicture = user?.profilePictureUrl;
```

---

#### Step 4: Remove Duplicate Hooks

**File:** `src/app/hooks/useUserProfile.ts`

**Action:** Deprecate this hook, replace with `useUserData`

**Migration:**
```typescript
// Old
import { useUserProfile } from '@/app/hooks/useUserProfile';
const { profile, counts } = useUserProfile(userId);

// New
import { useUserData } from '@/hooks/useUserData';
const { user: profile } = useUserData(userId);
// Counts should be fetched separately or calculated
```

---

#### Step 5: Consolidate Caches

**File:** `src/app/services/dataService.ts`

**Action:** Remove `getUserProfile` function, use `getUserData` from `userData.ts` instead

**Migration:**
```typescript
// Old
import { getUserProfile } from '@/app/services/dataService';
const profile = await getUserProfile(userId);

// New
import { getUserData } from '@/lib/userData';
const profile = await getUserData(userId);
```

---

#### Step 6: Fix Group Member Counts

**File:** `src/app/profile/[userId]/page.tsx`

**Before:**
```typescript
stats: {
  groupsCount: counts?.groups || groups.length || 0, // ❌ Two sources
}
```

**After:**
```typescript
import { useGroupMemberCount } from '@/hooks/useGroupMemberCount';

// Calculate from groups array (single source)
const groupsCount = groups.length; // ✅ Always use array length
```

**File:** `src/components/group/GroupHeader.jsx`

**Before:**
```typescript
{group.memberCount || group.members?.length || 0} // ❌ Two sources
```

**After:**
```typescript
import { useGroupMemberCount } from '@/hooks/useGroupMemberCount';

const memberCount = useGroupMemberCount(groupId); // ✅ Single source
// Or if you have group object:
const memberCount = Array.isArray(group.members) ? group.members.length : 0;
```

---

## Field Name Standardization

### Profile Picture

**Always use:** `profilePictureUrl`

**Never use:**
- ❌ `photoURL`
- ❌ `avatar`
- ❌ `avatarUrl`

**Migration:**
```typescript
import { getProfilePictureUrl } from '@/lib/userDataMapper';

// Old
const avatar = user.photoURL || user.avatar;

// New
const avatar = getProfilePictureUrl(user); // Returns profilePictureUrl
```

---

### Display Name

**Always use:** `displayName`

**Never use:**
- ❌ `name`

**Migration:**
```typescript
import { getDisplayName } from '@/lib/userDataMapper';

// Old
const name = user.name || user.displayName;

// New
const name = getDisplayName(user); // Returns displayName
```

---

## Testing Checklist

After migration, verify:

- [ ] Profile picture shows same image in sidebar and profile page
- [ ] Group member counts are consistent across all views
- [ ] User name displays consistently
- [ ] Profile picture updates propagate everywhere
- [ ] No duplicate API calls
- [ ] Cache invalidation works correctly

---

## Rollout Plan

### Phase 1: Core Hooks (Done)
- ✅ Create `useUserData` hook
- ✅ Create `useGroupMemberCount` hook
- ✅ Create `userDataMapper` utility

### Phase 2: Critical Components
1. Update Profile Page
2. Update Sidebar
3. Update AuthContext usage

### Phase 3: All Components
4. Update all components using `useUserProfile`
5. Update all components using `profile.photoURL`
6. Update all components using `group.memberCount`

### Phase 4: Cleanup
7. Remove `useUserProfile` hook
8. Remove `getUserProfile` from dataService
9. Consolidate caches

---

## Expected Results

### Before
- ❌ Profile picture different in sidebar vs profile page
- ❌ Group count shows 10 in one place, 5 in another
- ❌ User name displays differently
- ❌ Updates don't propagate

### After
- ✅ Profile picture consistent everywhere
- ✅ Group count always accurate
- ✅ User name consistent
- ✅ Updates propagate automatically

---

**Next Step:** Review this plan and approve for implementation.


