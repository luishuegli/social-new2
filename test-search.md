# Search System Test Plan

## Quick Test (In Browser)

### 1. Test Sidebar Search
1. Start your dev server: `npm run dev`
2. Open the app in your browser
3. Look at the sidebar on the left
4. Find the search bar (below the header)
5. Type any text (e.g., "test", "john", "book")
6. Results should appear below the search box

### 2. Test API Endpoint Directly
Open in browser:
```
http://localhost:3000/api/search?query=test
```

Expected response:
```json
{
  "results": [...],
  "query": "test",
  "totalCount": 0,
  "timestamp": 1697000000000
}
```

## Manual Test Cases

### Test Case 1: User Search by Username
**Steps:**
1. Type a username that exists in your database
2. Results should show matching users
3. Click a user result
4. Should navigate to user's profile

**Expected:** User appears in results with avatar and @username

### Test Case 2: User Search by Display Name
**Steps:**
1. Type a display name (first or last name)
2. Results should show matching users

**Expected:** Users with matching display names appear

### Test Case 3: Group Search
**Steps:**
1. Type a group name that exists
2. Results should show matching groups
3. Click a group result
4. Should navigate to group page

**Expected:** Groups appear with group icon and member count

### Test Case 4: Debouncing
**Steps:**
1. Type quickly: "abcdefghij"
2. Watch network tab

**Expected:** Only 1-2 API requests, not 10

### Test Case 5: Clear Search
**Steps:**
1. Type something
2. Click the X button (clear)

**Expected:** Search clears, results disappear

### Test Case 6: Click Outside
**Steps:**
1. Type something to show results
2. Click anywhere outside the search area

**Expected:** Results dropdown closes

### Test Case 7: ESC Key
**Steps:**
1. Type something to show results
2. Press ESC key

**Expected:** Results dropdown closes

### Test Case 8: Empty Search
**Steps:**
1. Click in search box
2. Don't type anything

**Expected:** No API call, no results

### Test Case 9: Special Characters
**Steps:**
1. Type: `@john`
2. Type: `#test`
3. Type: `user@email.com`

**Expected:** Handles gracefully, shows relevant results

### Test Case 10: Long Query
**Steps:**
1. Type a very long search query (50+ characters)

**Expected:** Works without errors

## Test Data Setup

If you don't have test data, create some:

### Create Test Users
```javascript
// In Firebase Console or via API
{
  username: "johndoe",
  displayName: "John Doe",
  profilePictureUrl: "https://example.com/avatar.jpg"
}

{
  username: "sarahsmith",
  displayName: "Sarah Smith",
  profilePictureUrl: ""
}
```

### Create Test Groups
```javascript
{
  groupName: "Hiking Club",
  memberCount: 24,
  groupAvatar: "https://example.com/group.jpg",
  description: "Weekly hiking adventures"
}

{
  groupName: "Book Readers",
  memberCount: 12,
  description: "Monthly book club"
}
```

## Performance Tests

### Test 1: Response Time
1. Open browser DevTools > Network
2. Type in search
3. Find the `/api/search` request
4. Check response time

**Expected:** < 500ms with indexes deployed

### Test 2: Concurrent Searches
1. Open 3 browser tabs
2. Search in all 3 simultaneously
3. Check all get results

**Expected:** All tabs work independently

## Error Cases

### Test 1: Network Error
**Steps:**
1. Open DevTools > Network
2. Set throttling to "Offline"
3. Try to search

**Expected:** Graceful error handling, no crash

### Test 2: Invalid Characters
**Steps:**
1. Type: `<script>alert('test')</script>`

**Expected:** Sanitized, no XSS vulnerability

### Test 3: Empty Database
**Steps:**
1. Search when no users/groups exist

**Expected:** "No results" state (empty array)

## Mobile Tests

### Test on Mobile View
1. Resize browser to mobile width (< 768px)
2. Click hamburger menu to open sidebar
3. Search for something
4. Click a result

**Expected:**
- Search works in mobile view
- Results are readable
- Clicking result closes sidebar
- Navigation works

## Browser Compatibility

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Debouncing works (< 3 requests for fast typing)
✅ Results appear within 500ms
✅ Mobile responsive
✅ Keyboard shortcuts work
✅ Click outside closes results
✅ No memory leaks (cleanup on unmount)

## Known Limitations

1. **Prefix matching only**: "john" finds "johndoe" but not "elijohn"
2. **Case sensitive in Firestore**: Lowercase conversion required
3. **No fuzzy search**: "jon" won't find "john"
4. **No typo tolerance**: "johhn" won't find "john"

For these features, consider integrating Algolia (see SEARCH_IMPLEMENTATION_GUIDE.md)

## Debugging Tips

### No results appearing?
```javascript
// Check API directly
fetch('/api/search?query=test')
  .then(r => r.json())
  .then(console.log)
```

### Check Firestore
```javascript
// Firebase Console > Firestore
// Verify documents exist with correct field names:
// - users.username
// - users.displayName
// - groups.groupName
```

### Check indexes
```bash
firebase firestore:indexes
```

### View logs
```javascript
// src/app/api/search/route.ts adds console.log
// Check terminal running `npm run dev`
```

## Report Issues

If something doesn't work:
1. Check browser console for errors
2. Check terminal for API errors
3. Verify Firestore indexes are deployed
4. Verify test data exists
5. Clear cache: `rm -rf .next && npm run dev`







