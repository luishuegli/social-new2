# Data Inconsistency Audit Report

**Date:** 2025-11-07  
**Focus:** User/Profile Model (Step 2 of Audit Plan)

---

## Executive Summary

**Critical Finding:** User/Profile data is fetched from **5+ different sources** and stored in **3+ different state management systems**, leading to severe data inconsistency issues.

**Impact:** 
- Profile pictures show different images in different views
- Group member counts are inconsistent
- User names display differently across components
- Data updates don't propagate across the app

---

## Step 2: User/Profile Model Audit

### 1. Data Fetching Methods

#### A. API Endpoints

| Endpoint | Location | Purpose | Returns |
|----------|----------|---------|---------|
| `/api/ensure-user-profile` | `src/app/api/ensure-user-profile/route.js` | Creates/ensures user profile exists | Full user profile |
| `/api/debug-current-user` | `src/app/api/debug-current-user/route.js` | Debug endpoint for current user | User + Firestore data |
| `/api/debug-user-state` | `src/app/api/debug-user-state/route.js` | Debug endpoint for user state | Auth + Firestore data |
| `/api/user-likes` | `src/app/api/user-likes/route.js` | Gets user's liked posts | User likes data |

**Problem:** Multiple endpoints return user data in different formats.

---

#### B. Direct Firestore Queries

| Location | Method | Query | Storage |
|----------|--------|-------|---------|
| `AuthContext.tsx` (line 56) | `getDoc(doc(db, 'users', userId))` | Direct Firestore read | `useState` in AuthContext |
| `useUserProfile.ts` (line 23) | `getUserProfile(userId)` → `dataService.ts` | Via service layer | `useState` in hook |
| `dataService.ts` (line 29) | `getDoc(doc(db, 'users', userId))` | Direct Firestore read | In-memory cache |
| `userData.ts` (line 48) | `getDoc(doc(db, 'users', userId))` | Direct Firestore read | In-memory cache (different cache!) |
| `profile/[userId]/page.tsx` | Via `useUserProfile` hook | Indirect | `useState` in hook |

**Problem:** **5 different places** fetch user data, each with their own cache and state.

---

#### C. Data Fetching Hooks

| Hook | Location | Fetches From | Stores In |
|------|----------|--------------|-----------|
| `useAuth()` | `AuthContext.tsx` | Firestore `users/{uid}` | `useState` in context |
| `useUserProfile(userId)` | `src/app/hooks/useUserProfile.ts` | `dataService.getUserProfile()` | `useState` in hook |
| `getUserData(userId)` | `src/lib/userData.ts` | Firestore `users/{uid}` | In-memory cache |
| `getUserProfile(userId)` | `src/app/services/dataService.ts` | Firestore `users/{uid}` | In-memory cache (different!) |

**Problem:** Multiple hooks fetch the same data independently, with no synchronization.

---

### 2. Data Storage Methods

#### A. State Management Systems

| System | Location | Stores | Updates When |
|--------|----------|--------|--------------|
| **AuthContext** | `src/app/contexts/AuthContext.tsx` | `user` (ExtendedUser) | Auth state changes |
| **useUserProfile Hook** | `src/app/hooks/useUserProfile.ts` | `profile` (UserProfile) | Component mounts |
| **dataService Cache** | `src/app/services/dataService.ts` | In-memory Map | On fetch |
| **userData Cache** | `src/lib/userData.ts` | In-memory Map | On fetch |

**Problem:** **4 separate storage systems** with no synchronization between them.

---

#### B. Component-Level State

| Component | State Variable | Source | Updates |
|-----------|---------------|--------|---------|
| `Sidebar` | `user` from `useAuth()` | AuthContext | Only on auth change |
| `UserProfileSection` | `user` prop from Sidebar | AuthContext | Only on auth change |
| `ProfilePage` | `profile` from `useUserProfile()` | Hook's useState | Only on mount |
| `SettingsProfilePicture` | `user` from `useAuth()` | AuthContext | Only on auth change |

**Problem:** Components use different sources, so updates don't propagate.

---

### 3. Profile Picture Field Conflicts

| Location | Field Used | Source | Problem |
|----------|------------|--------|---------|
| `AuthContext.tsx` | `profilePictureUrl` | Firestore `users.profilePictureUrl` | ✅ Correct |
| `UserProfileSection.tsx` | `profilePictureUrl \|\| photoURL` | AuthContext user | ⚠️ Fallback to wrong field |
| `ProfilePage.tsx` | `photoURL` | `profile?.photoURL` | ❌ Wrong field name! |
| `SettingsProfilePicture.tsx` | `profilePictureUrl` | AuthContext user | ✅ Correct |
| `userData.ts` | `profilePictureUrl \|\| photoURL` | Firestore | ⚠️ Fallback to wrong field |
| `dataService.ts` | `photoURL` | Firestore `users.photoURL` | ❌ Wrong field name! |

**Critical Conflict:**
- **Sidebar** uses `user.profilePictureUrl` from AuthContext
- **Profile Page** uses `profile.photoURL` from useUserProfile hook
- **These are different fields!** Profile page will show wrong/old image.

---

### 4. Group Member Count Conflicts

| Location | Calculation | Source | Problem |
|----------|-------------|--------|---------|
| `ProfilePage.tsx` (line 83) | `counts?.groups \|\| groups.length` | Two different sources! | ⚠️ Inconsistent |
| `useUserProfile.ts` (line 37) | `groupsSnap.size` | Direct Firestore query | ⚠️ Calculated on mount |
| `useUserGroups.ts` (line 26) | `getUserGroups()` → `groups.length` | Service layer | ⚠️ Different calculation |
| `GroupHeader.jsx` (line 112) | `group.memberCount \|\| group.members?.length` | Two different sources! | ⚠️ Inconsistent |
| `ModernGroupCard.jsx` (line 188) | `group.memberCount` | Group object | ⚠️ May be stale |

**Critical Conflict:**
- **Profile Page** shows: `counts?.groups || groups.length` (10 vs 5 in your screenshot!)
- **Sidebar** shows: Different count from different source
- **Group Cards** show: `group.memberCount` which may be denormalized and stale

---

## Step 3: Conflict Report

### Conflict #1: Profile Picture - Sidebar vs Profile Page

**Location 1:** `src/app/components/sidebar/UserProfileSection.tsx`
```typescript
// Line 23: Uses profilePictureUrl from AuthContext
const profilePicture = user.profilePictureUrl || user.photoURL;
```

**Location 2:** `src/app/profile/[userId]/page.tsx`
```typescript
// Line 78: Uses photoURL from useUserProfile hook
avatar: profile?.photoURL || '',
```

**Problem:**
- Sidebar fetches from `AuthContext` → `user.profilePictureUrl`
- Profile page fetches from `useUserProfile` hook → `profile.photoURL`
- These are **different fields** from **different sources**
- When profile picture is updated, AuthContext may update but `useUserProfile` hook doesn't
- Result: **Different images shown in sidebar vs profile page**

---

### Conflict #2: Group Member Count - Multiple Sources

**Location 1:** `src/app/profile/[userId]/page.tsx`
```typescript
// Line 83: Uses TWO different sources!
stats: {
  groupsCount: counts?.groups || groups.length || 0,
  // ...
}
```

**Location 2:** `src/app/hooks/useUserProfile.ts`
```typescript
// Line 34-37: Calculates count on mount
const groupsQ = query(collection(db, 'groups'), where('members', 'array-contains', userId));
const groupsSnap = await getDocs(groupsQ);
setCounts({ groups: groupsSnap.size, posts: postsSnap.size });
```

**Location 3:** `src/app/hooks/useUserGroups.ts`
```typescript
// Line 25-26: Fetches groups array
const userGroups = await getUserGroups(targetUserId);
setGroups(userGroups);
```

**Problem:**
- `counts.groups` is calculated once on mount (may be stale)
- `groups.length` is from a different hook that fetches separately
- These are **not synchronized** - one may be 10, the other 5
- Result: **Inconsistent group counts across the app**

---

### Conflict #3: User Name - Different Field Names

**Location 1:** `src/app/components/sidebar/UserProfileSection.tsx`
```typescript
// Line 24: Uses displayName
const displayName = user.displayName || 'User';
```

**Location 2:** `src/app/profile/[userId]/page.tsx`
```typescript
// Line 77: Uses username OR displayName
name: profile?.username || profile?.displayName || 'User',
```

**Problem:**
- Sidebar shows `displayName`
- Profile page shows `username || displayName`
- Different fallback logic = different names shown

---

### Conflict #4: Multiple Caching Systems

**Cache 1:** `src/lib/userData.ts`
```typescript
const userCache = new Map<string, UserData | null>();
const cacheTimestamp = new Map<string, number>();
```

**Cache 2:** `src/app/services/dataService.ts`
```typescript
const cache = new Map<string, { data: any; expires: number }>();
```

**Problem:**
- **Two separate caches** for the same data
- Updating one doesn't invalidate the other
- Result: **Stale data shown in different parts of the app**

---

### Conflict #5: AuthContext vs useUserProfile Hook

**Source 1:** `AuthContext.tsx`
- Fetches user data on auth state change
- Stores in `useState` in context
- Only updates when auth state changes

**Source 2:** `useUserProfile.ts`
- Fetches user data on component mount
- Stores in `useState` in hook
- Only updates when component remounts

**Problem:**
- **Two independent data sources**
- Profile picture update doesn't trigger AuthContext update
- Profile page uses `useUserProfile` which doesn't know about AuthContext updates
- Result: **Data becomes out of sync**

---

## Step 4: Single Source of Truth Solution

### Proposed Solution: Unified User Data Hook with React Query

**Create:** `src/hooks/useUserData.ts`

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserData, invalidateUserCache } from '@/lib/userData';

export function useUserData(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userId ? getUserData(userId) : null,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Invalidate cache when user data is updated
  const invalidate = () => {
    if (userId) {
      invalidateUserCache(userId);
      queryClient.invalidateQueries(['user', userId]);
    }
  };

  return {
    user: data,
    isLoading,
    error,
    invalidate,
  };
}
```

**Benefits:**
1. ✅ Single source of truth via React Query
2. ✅ Automatic cache invalidation
3. ✅ Automatic refetching when data changes
4. ✅ Shared cache across all components
5. ✅ Background updates

---

### Migration Plan

#### Phase 1: Replace AuthContext User Data

**Current:**
```typescript
// AuthContext.tsx
const [user, setUser] = useState<User | null>(null);
// Fetches from Firestore on auth change
```

**New:**
```typescript
// AuthContext.tsx - Keep only auth state
const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

// Components use useUserData hook instead
const { user } = useUserData(firebaseUser?.uid);
```

---

#### Phase 2: Replace useUserProfile Hook

**Current:**
```typescript
// useUserProfile.ts
const [profile, setProfile] = useState<UserProfile | null>(null);
// Fetches independently
```

**New:**
```typescript
// Use unified hook
const { user: profile } = useUserData(userId);
```

---

#### Phase 3: Standardize Field Names

**Create:** `src/lib/userDataMapper.ts`

```typescript
export function normalizeUserData(data: any): UserData {
  return {
    uid: data.uid || data.id,
    displayName: data.displayName || data.name || 'User',
    username: data.username || data.email?.split('@')[0] || `user${data.uid?.slice(-4)}`,
    profilePictureUrl: data.profilePictureUrl || data.photoURL || null, // Always use profilePictureUrl
    bio: data.bio,
    email: data.email,
  };
}
```

**Update all components to use:**
- ✅ `profilePictureUrl` (not `photoURL` or `avatar`)
- ✅ `displayName` (not `name`)
- ✅ `username` (consistent)

---

#### Phase 4: Fix Group Member Counts

**Create:** `src/hooks/useGroupMemberCount.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getGroupData } from '@/lib/groupData';

export function useGroupMemberCount(groupId: string) {
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupData(groupId),
  });

  // Always calculate from members array (single source of truth)
  const memberCount = group?.members?.length || 0;
  
  return memberCount;
}
```

**Update all components:**
- Remove `group.memberCount` (denormalized field)
- Always calculate from `group.members.length`
- Use `useGroupMemberCount` hook

---

## Implementation Priority

### P0 (Critical - Fix Immediately)

1. ✅ **Unify profile picture field** - Use `profilePictureUrl` everywhere
2. ✅ **Replace useUserProfile with useUserData** - Single source
3. ✅ **Fix group member count calculation** - Always use `members.length`

### P1 (High Priority)

4. ✅ **Migrate AuthContext to use useUserData**
5. ✅ **Remove duplicate caches** - Keep only `userData.ts` cache
6. ✅ **Standardize field names** - Create mapper utility

### P2 (Medium Priority)

7. ✅ **Add React Query** - For better cache management
8. ✅ **Add real-time updates** - Firestore listeners for user data
9. ✅ **Add optimistic updates** - For better UX

---

## Files to Update

### High Priority

1. `src/app/contexts/AuthContext.tsx` - Remove user data fetching
2. `src/app/hooks/useUserProfile.ts` - Replace with useUserData
3. `src/app/profile/[userId]/page.tsx` - Use unified hook
4. `src/app/components/sidebar/UserProfileSection.tsx` - Use unified hook
5. `src/app/services/dataService.ts` - Remove or consolidate with userData.ts

### Medium Priority

6. All components using `profile.photoURL` → Change to `user.profilePictureUrl`
7. All components using `group.memberCount` → Use `members.length`
8. All components using `counts.groups` → Use unified hook

---

## Next Steps

1. **Review this audit report**
2. **Approve the single source of truth solution**
3. **I'll implement the unified `useUserData` hook**
4. **Migrate components one by one**
5. **Test for data consistency**

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours for full migration


