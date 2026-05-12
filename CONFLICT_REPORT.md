# Data Inconsistency Conflict Report

**Date:** 2025-11-07  
**Model:** User/Profile Data

---

## 🔴 Conflict #1: Profile Picture - Sidebar vs Profile Page

### Location 1: Sidebar
**File:** `src/app/components/sidebar/UserProfileSection.tsx`  
**Line:** 23  
**Code:**
```typescript
const profilePicture = user.profilePictureUrl || user.photoURL;
```
**Source:** `user` from `useAuth()` → `AuthContext` → Firestore `users.profilePictureUrl`

### Location 2: Profile Page
**File:** `src/app/profile/[userId]/page.tsx`  
**Line:** 78  
**Code:**
```typescript
avatar: profile?.photoURL || '',
```
**Source:** `profile` from `useUserProfile()` hook → `dataService.getUserProfile()` → Firestore `users.photoURL`

### ❌ Problem
- **Sidebar** fetches from `AuthContext` → uses `profilePictureUrl` field
- **Profile Page** fetches from `useUserProfile` hook → uses `photoURL` field
- **These are different fields!** When profile picture is updated:
  - AuthContext may update `profilePictureUrl`
  - But `useUserProfile` hook still has old `photoURL`
  - Result: **Different images shown**

### ✅ Solution
Use unified `useUserData` hook and always use `profilePictureUrl` field:
```typescript
import { useUserData } from '@/hooks/useUserData';
import { getProfilePictureUrl } from '@/lib/userDataMapper';

const { user } = useUserData(userId);
const profilePicture = getProfilePictureUrl(user); // Always profilePictureUrl
```

---

## 🔴 Conflict #2: Group Member Count - Multiple Sources

### Location 1: Profile Page
**File:** `src/app/profile/[userId]/page.tsx`  
**Line:** 83  
**Code:**
```typescript
stats: {
  groupsCount: counts?.groups || groups.length || 0,
}
```
**Source 1:** `counts.groups` from `useUserProfile` hook → Calculated on mount  
**Source 2:** `groups.length` from `useUserGroups` hook → Fetched separately

### Location 2: useUserProfile Hook
**File:** `src/app/hooks/useUserProfile.ts`  
**Line:** 34-37  
**Code:**
```typescript
const groupsQ = query(collection(db, 'groups'), where('members', 'array-contains', userId));
const groupsSnap = await getDocs(groupsQ);
setCounts({ groups: groupsSnap.size, posts: postsSnap.size });
```
**Source:** Direct Firestore query, calculated once on mount

### Location 3: useUserGroups Hook
**File:** `src/app/hooks/useUserGroups.ts`  
**Line:** 25-26  
**Code:**
```typescript
const userGroups = await getUserGroups(targetUserId);
setGroups(userGroups);
```
**Source:** `dataService.getUserGroups()` → Different query, different timing

### ❌ Problem
- `counts.groups` is calculated **once on mount** (may be stale)
- `groups.length` is from a **different hook** that fetches separately
- These are **not synchronized** - one may be 10, the other 5
- Result: **Inconsistent group counts** (as seen in your screenshot: 10 vs 5)

### ✅ Solution
Always calculate from groups array (single source):
```typescript
import { useUserGroups } from '@/app/hooks/useUserGroups';

const { groups } = useUserGroups(userId);
const groupsCount = groups.length; // ✅ Always use array length
```

---

## 🔴 Conflict #3: User Name - Different Field Names

### Location 1: Sidebar
**File:** `src/app/components/sidebar/UserProfileSection.tsx`  
**Line:** 24  
**Code:**
```typescript
const displayName = user.displayName || 'User';
```
**Source:** `user` from `useAuth()` → `AuthContext`

### Location 2: Profile Page
**File:** `src/app/profile/[userId]/page.tsx`  
**Line:** 77  
**Code:**
```typescript
name: profile?.username || profile?.displayName || 'User',
```
**Source:** `profile` from `useUserProfile` hook

### ❌ Problem
- **Sidebar** shows `displayName`
- **Profile Page** shows `username || displayName`
- Different fallback logic = different names shown
- Result: **Inconsistent user names**

### ✅ Solution
Use normalized getter:
```typescript
import { getDisplayName } from '@/lib/userDataMapper';

const displayName = getDisplayName(user); // ✅ Consistent
```

---

## 🔴 Conflict #4: Multiple Caching Systems

### Cache 1: userData.ts
**File:** `src/lib/userData.ts`  
**Lines:** 30-32  
**Code:**
```typescript
const userCache = new Map<string, UserData | null>();
const cacheTimestamp = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### Cache 2: dataService.ts
**File:** `src/app/services/dataService.ts`  
**Lines:** 7-8  
**Code:**
```typescript
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### ❌ Problem
- **Two separate caches** for the same data
- Updating one doesn't invalidate the other
- Result: **Stale data shown in different parts of the app**

### ✅ Solution
Use only `userData.ts` cache, remove `dataService.ts` cache:
```typescript
// Remove getUserProfile from dataService.ts
// Use getUserData from userData.ts instead
import { getUserData } from '@/lib/userData';
```

---

## 🔴 Conflict #5: AuthContext vs useUserProfile Hook

### Source 1: AuthContext
**File:** `src/app/contexts/AuthContext.tsx`  
**Lines:** 56-101  
**Code:**
```typescript
const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
const userData = userDoc.data();
const extendedUser = {
  ...firebaseUser,
  profilePictureUrl: userData?.profilePictureUrl
} as ExtendedUser;
setUser(extendedUser);
```
**Updates When:** Auth state changes

### Source 2: useUserProfile Hook
**File:** `src/app/hooks/useUserProfile.ts`  
**Lines:** 22-26  
**Code:**
```typescript
const userProfile = await fetchUserProfile(userId);
setProfile(userProfile);
```
**Updates When:** Component mounts

### ❌ Problem
- **Two independent data sources**
- Profile picture update doesn't trigger AuthContext update
- Profile page uses `useUserProfile` which doesn't know about AuthContext updates
- Result: **Data becomes out of sync**

### ✅ Solution
Use unified `useUserData` hook everywhere:
```typescript
// Remove user data fetching from AuthContext
// Components use useUserData hook instead
import { useUserData } from '@/hooks/useUserData';

const { user } = useUserData(userId); // ✅ Single source
```

---

## 📊 Summary Table

| Conflict | Location 1 | Location 2 | Problem | Impact |
|----------|-----------|------------|---------|--------|
| **Profile Picture** | Sidebar: `user.profilePictureUrl` | Profile: `profile.photoURL` | Different fields | 🔴 Different images |
| **Group Count** | `counts.groups` (10) | `groups.length` (5) | Two sources | 🔴 Inconsistent counts |
| **User Name** | Sidebar: `displayName` | Profile: `username \|\| displayName` | Different fallback | ⚠️ Different names |
| **Caching** | `userData.ts` cache | `dataService.ts` cache | Two caches | 🔴 Stale data |
| **Data Source** | AuthContext | useUserProfile | Two sources | 🔴 Out of sync |

---

## ✅ Solution Summary

### Created Files

1. ✅ `src/hooks/useUserData.ts` - Unified user data hook
2. ✅ `src/hooks/useGroupMemberCount.ts` - Unified group member count hook
3. ✅ `src/lib/userDataMapper.ts` - Field name normalization

### Migration Required

1. **Profile Page** - Use `useUserData` instead of `useUserProfile`
2. **Sidebar** - Use `useUserData` instead of `useAuth().user`
3. **AuthContext** - Remove user data fetching
4. **All Components** - Use `getProfilePictureUrl()` helper
5. **Group Counts** - Always use `groups.length` (never `memberCount`)

---

## 🎯 Expected Results

### Before
- ❌ Profile picture: Sidebar shows image A, Profile page shows image B
- ❌ Group count: Shows 10 in one place, 5 in another
- ❌ User name: Shows "Luis H..." in sidebar, "luishuegli" in profile
- ❌ Updates don't propagate

### After
- ✅ Profile picture: Same image everywhere
- ✅ Group count: Always accurate and consistent
- ✅ User name: Consistent everywhere
- ✅ Updates propagate automatically

---

**Status:** Ready for implementation  
**Next Step:** Review and approve migration plan


