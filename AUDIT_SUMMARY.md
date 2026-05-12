# Data Inconsistency Audit - Complete Summary

**Date:** 2025-11-07  
**Status:** ✅ Audit Complete, Solutions Ready

---

## 📋 Executive Summary

**Critical Finding:** Your app has **5+ different sources** fetching User/Profile data, stored in **3+ different state management systems**, leading to severe data inconsistency.

**Evidence from Screenshots:**
- Profile picture shows different images in sidebar vs profile page
- Group member count shows 10 in one place, 5 in another
- User name displays differently across components

**Root Cause:** No single source of truth for user data.

---

## 🔍 Step 2: User/Profile Model Audit Results

### 1. Data Fetching Methods Found

#### A. API Endpoints (4 found)
1. `/api/ensure-user-profile` - Creates/ensures user profile
2. `/api/debug-current-user` - Debug endpoint
3. `/api/debug-user-state` - Debug endpoint
4. `/api/user-likes` - Gets user's liked posts

#### B. Direct Firestore Queries (5 found)
1. `AuthContext.tsx` (line 56) - `getDoc(doc(db, 'users', userId))`
2. `useUserProfile.ts` (line 23) - Via `dataService.getUserProfile()`
3. `dataService.ts` (line 29) - `getDoc(doc(db, 'users', userId))`
4. `userData.ts` (line 48) - `getDoc(doc(db, 'users', userId))`
5. `profile/[userId]/page.tsx` - Via `useUserProfile` hook

#### C. Data Fetching Hooks (4 found)
1. `useAuth()` - Fetches from Firestore on auth change
2. `useUserProfile(userId)` - Fetches via dataService
3. `getUserData(userId)` - Fetches from userData utility
4. `getUserProfile(userId)` - Fetches from dataService (duplicate!)

---

### 2. Data Storage Methods Found

#### A. State Management Systems (4 found)
1. **AuthContext** - `useState` in context (updates on auth change)
2. **useUserProfile Hook** - `useState` in hook (updates on mount)
3. **dataService Cache** - In-memory Map (5 min TTL)
4. **userData Cache** - In-memory Map (5 min TTL, different cache!)

#### B. Component-Level State (Multiple)
- `Sidebar` - Uses `user` from `useAuth()`
- `UserProfileSection` - Uses `user` prop from Sidebar
- `ProfilePage` - Uses `profile` from `useUserProfile()`
- `SettingsProfilePicture` - Uses `user` from `useAuth()`

---

### 3. Profile Picture Field Conflicts

| Location | Field Used | Source | Status |
|----------|------------|--------|--------|
| `AuthContext.tsx` | `profilePictureUrl` | Firestore | ✅ Correct |
| `UserProfileSection.tsx` | `profilePictureUrl \|\| photoURL` | AuthContext | ⚠️ Fallback |
| `ProfilePage.tsx` | `photoURL` | useUserProfile | ❌ **Wrong field!** |
| `SettingsProfilePicture.tsx` | `profilePictureUrl` | AuthContext | ✅ Correct |
| `userData.ts` | `profilePictureUrl \|\| photoURL` | Firestore | ⚠️ Fallback |
| `dataService.ts` | `photoURL` | Firestore | ❌ **Wrong field!** |

**Critical Issue:** Profile page uses `photoURL` while sidebar uses `profilePictureUrl` - **these are different fields!**

---

### 4. Group Member Count Conflicts

| Location | Calculation | Source | Problem |
|----------|-------------|--------|---------|
| `ProfilePage.tsx` (line 83) | `counts?.groups \|\| groups.length` | **Two sources!** | ⚠️ Inconsistent |
| `useUserProfile.ts` (line 37) | `groupsSnap.size` | Direct query | ⚠️ Calculated once |
| `useUserGroups.ts` (line 26) | `groups.length` | Service layer | ⚠️ Different timing |
| `GroupHeader.jsx` (line 112) | `memberCount \|\| members.length` | **Two sources!** | ⚠️ Inconsistent |

**Critical Issue:** Profile page shows `counts?.groups || groups.length` - **10 vs 5 in your screenshot!**

---

## 🔴 Step 3: Conflict Report

### Conflict #1: Profile Picture - Sidebar vs Profile Page

**Sidebar (`UserProfileSection.tsx`):**
```typescript
const profilePicture = user.profilePictureUrl || user.photoURL;
// Source: AuthContext → user.profilePictureUrl
```

**Profile Page (`profile/[userId]/page.tsx`):**
```typescript
avatar: profile?.photoURL || '',
// Source: useUserProfile hook → profile.photoURL
```

**Problem:**
- Sidebar uses `profilePictureUrl` field
- Profile page uses `photoURL` field
- **Different fields = different images shown**

---

### Conflict #2: Group Member Count - Multiple Sources

**Profile Page:**
```typescript
stats: {
  groupsCount: counts?.groups || groups.length || 0,
  // counts.groups = 10 (from useUserProfile)
  // groups.length = 5 (from useUserGroups)
}
```

**Problem:**
- `counts.groups` calculated once on mount (may be stale)
- `groups.length` from different hook (different timing)
- **Not synchronized = inconsistent counts (10 vs 5)**

---

### Conflict #3: Multiple Caching Systems

**Cache 1:** `userData.ts`
```typescript
const userCache = new Map<string, UserData | null>();
```

**Cache 2:** `dataService.ts`
```typescript
const cache = new Map<string, { data: any; expires: number }>();
```

**Problem:**
- Two separate caches for same data
- Updating one doesn't invalidate the other
- **Stale data shown in different parts of app**

---

### Conflict #4: AuthContext vs useUserProfile Hook

**AuthContext:**
- Fetches user data on auth state change
- Stores in `useState` in context
- Only updates when auth changes

**useUserProfile Hook:**
- Fetches user data on component mount
- Stores in `useState` in hook
- Only updates when component remounts

**Problem:**
- Two independent data sources
- Profile picture update doesn't trigger both
- **Data becomes out of sync**

---

## ✅ Step 4: Single Source of Truth Solution

### Solution Created

**1. Unified User Data Hook**
- ✅ `src/hooks/useUserData.ts` - Single hook for all user data
- Uses `userData.ts` utility (single cache)
- Automatic cache invalidation
- Consistent field names

**2. Unified Group Member Count Hook**
- ✅ `src/hooks/useGroupMemberCount.ts` - Always calculates from `members.length`
- Never uses denormalized `memberCount` field

**3. Field Name Normalization**
- ✅ `src/lib/userDataMapper.ts` - Normalizes field names
- Always returns `profilePictureUrl` (not `photoURL`)
- Always returns `displayName` (not `name`)

---

### Migration Plan

#### Phase 1: Update Profile Page (Critical)
```typescript
// OLD
const { profile, counts } = useUserProfile(userId);
avatar: profile?.photoURL || '', // ❌ Wrong field
groupsCount: counts?.groups || groups.length || 0, // ❌ Two sources

// NEW
import { useUserData } from '@/hooks/useUserData';
import { getProfilePictureUrl } from '@/lib/userDataMapper';

const { user } = useUserData(userId);
avatar: getProfilePictureUrl(user), // ✅ Always profilePictureUrl
groupsCount: groups.length, // ✅ Single source
```

#### Phase 2: Update Sidebar
```typescript
// OLD
const { user } = useAuth();
const profilePicture = user.profilePictureUrl || user.photoURL;

// NEW
const { firebaseUser } = useAuth();
const { user } = useUserData(firebaseUser?.uid);
const profilePicture = getProfilePictureUrl(user);
```

#### Phase 3: Update AuthContext
```typescript
// OLD - Fetches user data from Firestore
const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
setUser(extendedUser);

// NEW - Keep only Firebase Auth user
setFirebaseUser(firebaseUser);
// Components use useUserData hook for profile data
```

---

## 📊 Files to Update

### High Priority (P0)
1. ✅ `src/app/profile/[userId]/page.tsx` - Use `useUserData` hook
2. ✅ `src/app/components/sidebar/UserProfileSection.tsx` - Use `useUserData` hook
3. ✅ `src/app/contexts/AuthContext.tsx` - Remove user data fetching

### Medium Priority (P1)
4. ✅ `src/app/hooks/useUserProfile.ts` - Deprecate, replace with `useUserData`
5. ✅ `src/app/services/dataService.ts` - Remove `getUserProfile`, use `getUserData`
6. ✅ All components using `profile.photoURL` → Change to `user.profilePictureUrl`

### Low Priority (P2)
7. ✅ All components using `group.memberCount` → Use `members.length`
8. ✅ All components using `counts.groups` → Use `groups.length`

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

## 📝 Next Steps

1. **Review this audit report**
2. **Approve the single source of truth solution**
3. **I'll implement the migration** (update components one by one)
4. **Test for data consistency**

---

## 📁 Documentation Created

1. ✅ `DATA_INCONSISTENCY_AUDIT.md` - Complete audit report
2. ✅ `CONFLICT_REPORT.md` - Detailed conflict analysis
3. ✅ `DATA_INCONSISTENCY_FIXES.md` - Implementation guide
4. ✅ `src/hooks/useUserData.ts` - Unified hook
5. ✅ `src/hooks/useGroupMemberCount.ts` - Unified group count hook
6. ✅ `src/lib/userDataMapper.ts` - Field normalization

---

**Status:** ✅ Audit Complete, Solutions Ready  
**Ready for:** Implementation and Migration


