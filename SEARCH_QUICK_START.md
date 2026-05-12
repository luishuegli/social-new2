# 🔍 Search & Discovery - Quick Start Guide

## Overview
Your intelligent search system is now **live and ready to use**! This guide will help you get started quickly.

---

## ✅ What's Been Implemented

### 1. **Backend API** 
`/api/search?query=john`
- Real-time search across users and groups
- Intelligent relevance scoring
- Optimized Firestore queries

### 2. **Frontend Components**
- **Sidebar Search Bar** (Already integrated ✅)
- **SearchResults Component** - Beautiful dropdown with results
- **useSearch Hook** - Reusable search logic

### 3. **Features**
- ✅ Real-time search as you type
- ✅ 300ms debouncing (prevents API spam)
- ✅ Multi-field search (username, displayName, groupName)
- ✅ Relevance scoring and ranking
- ✅ Loading states and error handling
- ✅ Click outside to close
- ✅ ESC key to dismiss
- ✅ Mobile responsive

---

## 🚀 How to Use

### Using the Sidebar (Already Working!)

1. **Open your app** and look at the sidebar
2. **Type in the search bar** at the top
3. **Results appear** automatically as you type
4. **Click any result** to navigate to that user or group

That's it! The search is already integrated and working.

---

## 💻 Using Search in Your Own Components

### Option 1: Use the `useSearch` Hook

```tsx
import { useSearch } from '../hooks/useSearch';
import SearchResults from '../components/SearchResults';

export default function MySearchComponent() {
  const { query, setQuery, results, isSearching } = useSearch();

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <SearchResults
        results={results}
        isLoading={isSearching}
      />
    </div>
  );
}
```

### Option 2: Direct API Call

```tsx
// Fetch search results directly
const response = await fetch('/api/search?query=john');
const data = await response.json();
console.log(data.results);
```

---

## 🎨 Example Implementations

We've created 5 complete examples in `src/components/examples/SearchExample.tsx`:

1. **BasicSearchExample** - Minimal implementation
2. **AdvancedSearchExample** - With clear button and custom debounce
3. **SearchWithFiltersExample** - With user/group filter buttons
4. **SearchPageExample** - Full-page search with keyboard shortcuts (⌘K)
5. **SearchModalExample** - Command palette style modal search

### Try an Example

```tsx
// In any page
import { SearchPageExample } from '@/components/examples/SearchExample';

export default function SearchPage() {
  return <SearchPageExample />;
}
```

---

## 📝 Common Use Cases

### 1. Add Search to a Page

```tsx
'use client';

import { useSearch } from '@/app/hooks/useSearch';

export default function DiscoverPage() {
  const { query, setQuery, results } = useSearch();

  return (
    <div className="p-4">
      <h1>Discover People</h1>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
      />
      <div>
        {results.map(result => (
          <div key={result.id}>{result.username || result.groupName}</div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Search with Custom Debounce

```tsx
const { query, setQuery, results } = useSearch({
  debounceMs: 500, // Wait 500ms after typing stops
  minQueryLength: 2 // Only search when 2+ characters
});
```

### 3. Clear Search Results

```tsx
const { query, setQuery, clearSearch } = useSearch();

// Clear everything
<button onClick={clearSearch}>Clear</button>
```

---

## 🧪 Testing Your Search

### Manual Testing Checklist

1. Open your app
2. Go to any page with the sidebar visible
3. Click on the search bar
4. Type: `@` (if you have users starting with @)
5. Type a common name like `john` or `sarah`
6. Try searching for a group name
7. Test rapid typing (should debounce)
8. Press ESC (should close results)
9. Click outside (should close results)

### Test Data Requirements

For search to work, you need:
- Users with `username` and `displayName` fields
- Groups with `groupName` field
- Both stored in Firestore collections: `users` and `groups`

---

## 🔧 Configuration Options

### useSearch Hook Options

```typescript
interface UseSearchOptions {
  debounceMs?: number;      // Default: 300
  minQueryLength?: number;  // Default: 1
}
```

### Example:
```tsx
const search = useSearch({
  debounceMs: 500,        // Wait 500ms before searching
  minQueryLength: 2       // Only search with 2+ characters
});
```

---

## 📊 API Response Format

```json
{
  "results": [
    {
      "id": "user123",
      "type": "user",
      "displayName": "John Doe",
      "username": "johndoe",
      "profilePictureUrl": "https://...",
      "relevanceScore": 100
    },
    {
      "id": "group456",
      "type": "group",
      "groupName": "Hiking Club",
      "memberCount": 24,
      "relevanceScore": 85
    }
  ],
  "query": "john",
  "totalCount": 2,
  "timestamp": 1697000000000
}
```

---

## 🎨 Customizing the UI

### Customize SearchResults Component

The `SearchResults` component accepts these props:

```typescript
interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultClick?: () => void;
}
```

You can create your own custom results component:

```tsx
function MyCustomResults({ results }) {
  return (
    <div className="my-custom-dropdown">
      {results.map(result => (
        <div key={result.id} className="my-result-item">
          {result.type === 'user' ? '👤' : '👥'} 
          {result.username || result.groupName}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔥 Firestore Requirements

### Required Indexes

Make sure these indexes exist in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "username", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "groups",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "groupName", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Required Fields

**Users Collection** (`/users/{userId}`):
```json
{
  "username": "johndoe",           // Required for search
  "displayName": "John Doe",       // Optional but recommended
  "profilePictureUrl": "https://..." // Optional
}
```

**Groups Collection** (`/groups/{groupId}`):
```json
{
  "groupName": "Hiking Club",      // Required for search
  "memberCount": 24,               // Optional
  "groupAvatar": "https://...",    // Optional
  "description": "A club for..."   // Optional
}
```

---

## ⚡ Performance Tips

1. **Debouncing is enabled by default** (300ms)
2. **Results are limited** to 12 total (configurable in API)
3. **Requests are cancelled** when typing continues
4. **Indexes are required** for fast queries

---

## 🐛 Troubleshooting

### No Results Appearing

1. Check browser console for errors
2. Verify Firestore indexes are deployed
3. Ensure you have test data (users/groups)
4. Check API route is accessible: `/api/search?query=test`

### Search is Slow

1. Deploy Firestore indexes (see above)
2. Check network tab for API response times
3. Increase debounce time: `useSearch({ debounceMs: 500 })`

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/app/api/search/route.ts` | Backend search API |
| `src/app/components/SearchResults.tsx` | Results dropdown UI |
| `src/app/components/Sidebar.tsx` | Sidebar with integrated search |
| `src/app/hooks/useSearch.ts` | Reusable search hook |
| `src/app/types/search.ts` | TypeScript types |
| `src/components/examples/SearchExample.tsx` | 5 complete examples |

---

## 🎯 Next Steps

1. **Test the sidebar search** (already working!)
2. **Try an example** from `SearchExample.tsx`
3. **Customize the UI** to match your design
4. **Add search to other pages** using `useSearch` hook
5. **Deploy Firestore indexes** for production performance

---

## 🚀 Future Enhancements

See `SEARCH_IMPLEMENTATION_GUIDE.md` for:
- Activity/post search
- Algolia integration (fuzzy search)
- Search filters
- Analytics
- AI-powered suggestions

---

## 💬 Support

Questions? Check these resources:
- Full documentation: `SEARCH_IMPLEMENTATION_GUIDE.md`
- Example components: `src/components/examples/SearchExample.tsx`
- TypeScript types: `src/app/types/search.ts`

---

**Status**: ✅ Ready to Use  
**Last Updated**: October 11, 2025  
**Version**: 1.0.0







