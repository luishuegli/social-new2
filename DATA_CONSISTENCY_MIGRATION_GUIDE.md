# Data Consistency Migration Guide

## Overview
This guide provides a step-by-step migration plan to fix the identified data consistency issues in group member counts and RSVP/Activity Mode synchronization.

## Issues Identified

### 1. Group Member Count Inconsistencies
- **Problem**: Multiple data sources for member counts with potential mismatches
- **Impact**: Users see different member counts in different components
- **Root Cause**: No single source of truth for member data

### 2. RSVP and Activity Mode Synchronization Issues
- **Problem**: RSVP actions don't update Activity Mode or Activity Context in real-time
- **Impact**: Stale data in Activity Mode, participants counts not synchronized
- **Root Cause**: Missing real-time listeners and context integration

## Migration Steps

### Step 1: Implement Enhanced Data Hooks
1. **Deploy `useGroupData.ts`**
   - Provides centralized group data management
   - Real-time synchronization for member counts
   - Single source of truth for member data

2. **Deploy `EnhancedActivityContext.tsx`**
   - Real-time activity synchronization
   - Integrated participant management
   - Context-wide activity state

3. **Deploy `useEnhancedRSVP.ts`**
   - Optimistic updates for responsive UI
   - Context integration for real-time sync
   - Event broadcasting for cross-component updates

### Step 2: Update Components (Gradual Migration)

#### Phase 1: Core Components
1. **Update GroupInspector.jsx**
```javascript
// Replace existing member count logic
import { useGroupData } from '@/app/hooks/useGroupData';

export default function GroupInspector({ group, onPlanActivity }) {
  const { groupData, memberCount, displayMembers } = useGroupData(group.id);
  
  // Use groupData.memberCount instead of group.members?.length
  // Use displayMembers for avatar display
}
```

2. **Update FomoGroupCard.jsx**
```javascript
// Replace member count calculation
import { useGroupData } from '@/app/hooks/useGroupData';

export default function FomoGroupCard({ group, size = 'large' }) {
  const { memberCount, displayMembers } = useGroupData(group.id);
  
  // Use consistent member count and display logic
}
```

#### Phase 2: Activity Components
1. **Replace activity-mode/page.tsx with EnhancedActivityModePage.tsx**
2. **Update layout.tsx to include EnhancedActivityProvider**
```javascript
import { EnhancedActivityProvider } from './contexts/EnhancedActivityContext';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <EnhancedActivityProvider>
        {children}
      </EnhancedActivityProvider>
    </AuthProvider>
  );
}
```

#### Phase 3: RSVP Integration
1. **Update GroupInspector RSVP handlers**
```javascript
import { useEnhancedRSVP } from '@/app/hooks/useEnhancedRSVP';

const { handleRSVP, hasRSVPd } = useEnhancedRSVP();
```

### Step 3: API Enhancements

#### Add User Profile API
Create `/api/user-profile/route.js`:
```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(userDoc.data());
}
```

### Step 4: Testing and Validation

#### Test Cases
1. **Member Count Consistency**
   - Join/leave group in one component
   - Verify count updates in all components
   - Check member modal vs. card display

2. **RSVP Synchronization**
   - RSVP to activity in GroupInspector
   - Verify Activity Mode updates immediately
   - Check Activity Context state

3. **Real-time Updates**
   - Open multiple browser tabs
   - Perform actions in one tab
   - Verify updates appear in other tabs

#### Performance Testing
- Monitor Firestore read operations
- Test with large member lists (100+ members)
- Verify memory usage with multiple listeners

### Step 5: Cleanup and Optimization

#### Remove Deprecated Code
1. Remove old activity-mode/page.tsx
2. Clean up unused imports in components
3. Remove mock data and temporary fixes

#### Optimize Firestore Queries
1. Add composite indexes if needed
2. Implement query result caching
3. Batch user profile requests

## Implementation Priority

### High Priority (Critical Fixes)
1. ✅ Enhanced Activity Context - Real-time RSVP sync
2. ✅ Group Data Hook - Consistent member counts
3. ✅ Enhanced RSVP Hook - Context integration

### Medium Priority (UX Improvements)
1. Enhanced Activity Mode Page - Better real-time UI
2. Optimistic updates for responsive interactions
3. Error handling and retry logic

### Low Priority (Performance Optimizations)
1. Query result caching
2. Batch operations
3. Memory usage optimization

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   - Revert to original components
   - Remove new context providers
   - Restore original API endpoints

2. **Partial Rollback**
   - Keep working components
   - Disable problematic features
   - Gradual re-deployment

## Monitoring and Metrics

### Key Metrics to Track
1. **Data Consistency**
   - Member count discrepancies
   - RSVP synchronization delays
   - Real-time update latency

2. **Performance**
   - Firestore read operations per user
   - Component re-render frequency
   - Memory usage patterns

3. **User Experience**
   - RSVP success rates
   - UI responsiveness
   - Error rates

## Best Practices Going Forward

### Data Management
1. **Single Source of Truth**: Always use centralized hooks for shared data
2. **Real-time Sync**: Implement onSnapshot listeners for critical data
3. **Optimistic Updates**: Update UI immediately, sync with server

### State Management
1. **Context for Global State**: Use React Context for app-wide data
2. **Local State for UI**: Keep component-specific state local
3. **Event Broadcasting**: Use custom events for cross-component communication

### Testing
1. **Integration Tests**: Test data flow across components
2. **Real-time Tests**: Verify synchronization across browser tabs
3. **Performance Tests**: Monitor Firestore usage and component performance

## Conclusion

This migration will resolve the critical data consistency issues while providing a robust foundation for future development. The enhanced hooks and contexts ensure that all components stay synchronized with real-time data updates, providing users with a consistent and responsive experience.

The gradual migration approach minimizes risk while allowing for thorough testing at each step. Once complete, the application will have a solid data management architecture that scales with future features and user growth.
