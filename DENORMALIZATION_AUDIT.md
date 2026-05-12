# Denormalization Audit Report

## Overview

This document identifies all denormalized data in the app and whether it should be removed or kept.

## ✅ Fixed: User Data Denormalization

### Issue
- `authorName` and `authorAvatar` stored in posts and comments
- Profile picture updates not reflected in old posts/comments

### Solution
- ✅ Created `userData.ts` utility for centralized fetching
- ✅ Removed denormalization from post creation
- ✅ Removed denormalization from comment creation
- ✅ Updated feed API to fetch from users collection
- ✅ Updated comments API to fetch from users collection

### Status: **FIXED**

---

## ✅ Fixed: Group Data Denormalization

### Issue
- `groupName` stored in posts and activities
- Group name updates not reflected in old posts/activities

### Solution
- ✅ Created `groupData.ts` utility for centralized fetching
- ✅ Updated feed API to fetch from groups collection
- ⚠️ **TODO**: Remove `groupName` from post creation
- ⚠️ **TODO**: Remove `groupName` from activity creation
- ⚠️ **TODO**: Update activities context to fetch group data

### Status: **PARTIALLY FIXED** (API routes fixed, creation routes need update)

---

## ⚠️ Intentional: Activity Data in Posts

### Current State
- `activityTitle`, `activityCategory`, `activityDate`, `activityDescription` stored in posts
- This is **intentional** for "activity-gated" posts

### Rationale
Posts are snapshots of activities at the time of posting. This ensures:
- Historical accuracy (what was the activity when posted?)
- Offline capability (post can be displayed without fetching activity)
- Performance (no need to fetch activity for every post)

### Recommendation: **KEEP AS IS**

---

## ❌ Issue: Activity Data Denormalization

### Issue
- Activities store `groupName` instead of just `groupId`
- If group name changes, old activities show wrong name

### Current Code
```typescript
// EnhancedActivityContext.tsx line 141
groupName: data.groupName, // ❌ Denormalized
```

### Solution Needed
1. Remove `groupName` from activity creation
2. Update `EnhancedActivityContext` to fetch group data
3. Create migration script to remove `groupName` from existing activities

### Status: **NEEDS FIXING**

---

## 📊 Summary

| Data Type | Denormalized In | Status | Action |
|-----------|----------------|--------|--------|
| User name/avatar | Posts, Comments | ✅ Fixed | Use `userData` utility |
| Group name/avatar | Posts, Activities | ⚠️ Partial | Use `groupData` utility |
| Activity data | Posts | ✅ Intentional | Keep as snapshot |
| Group name | Activities | ❌ Needs Fix | Remove, fetch from groups |

---

## Next Steps

1. ✅ **DONE**: User data denormalization fixed
2. ✅ **DONE**: Group data fetching utility created
3. ⚠️ **TODO**: Remove `groupName` from post creation
4. ⚠️ **TODO**: Remove `groupName` from activity creation
5. ⚠️ **TODO**: Update `EnhancedActivityContext` to fetch group data
6. ⚠️ **TODO**: Create migration script for activities

---

## Migration Scripts

### User Data Migration
- ✅ Created: `/api/migrate-remove-denormalized-user-data`
- Removes `authorName` and `authorAvatar` from posts and comments

### Group Data Migration (Needed)
- ⚠️ **TODO**: Create `/api/migrate-remove-denormalized-group-data`
- Should remove `groupName` from posts and activities

---

## Best Practices Going Forward

1. **Never denormalize** user or group data (name, avatar, description)
2. **Always use utilities**: `getUserData()`, `getGroupData()`, etc.
3. **Batch fetch**: Use `getUsersData()`, `getGroupsData()` for multiple items
4. **Activity snapshots**: OK to store activity data in posts (intentional)
5. **Document exceptions**: If denormalization is needed, document why

---

## Performance Impact

### Before
- Posts: 1 read for post + 1 read for user + 1 read for group = **3 reads**
- With denormalization: 1 read for post = **1 read** (but stale data)

### After (With Utilities)
- Posts: 1 read for post + batch read for users + batch read for groups = **~3 reads** (but fresh data)
- Batch fetching reduces overhead significantly
- Caching reduces redundant reads

### Conclusion
Slight increase in reads, but:
- ✅ Data is always fresh
- ✅ Batch fetching minimizes overhead
- ✅ Caching reduces redundant reads
- ✅ Better user experience (updates reflect immediately)


