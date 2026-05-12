// src/app/api/compass/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';

/**
 * GET /api/compass/activities
 * Fetches discoverable activities that the user is not already a member of
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Step 1: Find all activities where the user is already a member
    let joinedActivityIds = new Set<string>();
    try {
      const userActivitiesSnapshot = await adminDb
        .collectionGroup('members')
        .where('userId', '==', userId)
        .get();

      userActivitiesSnapshot.docs.forEach(doc => {
        // The parent of members collection is the activity document
        const activityId = doc.ref.parent.parent?.id;
        if (activityId) {
          joinedActivityIds.add(activityId);
        }
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      // Continue without filtering - it's okay if this fails
    }

    // Step 2: Fetch all public/discoverable activities
    // Try with isPublic filter first, fallback to all activities if needed
    let activitiesSnapshot;
    try {
      activitiesSnapshot = await adminDb
        .collection('activities')
        .where('isPublic', '==', true)
        .orderBy('date', 'asc')
        .limit(50)
        .get();
    } catch (error) {
      console.log('Trying without isPublic filter:', error);
      // Fallback: try without the isPublic filter
      try {
        activitiesSnapshot = await adminDb
          .collection('activities')
          .orderBy('date', 'asc')
          .limit(50)
          .get();
      } catch (fallbackError) {
        console.error('Error fetching activities:', fallbackError);
        // Return empty array instead of error
        return NextResponse.json({
          success: true,
          activities: [],
          count: 0,
          message: 'No activities available at the moment'
        });
      }
    }

    // Step 3: Filter out activities the user has already joined
    const discoverableActivities = [];
    const now = new Date();

    // If no activities found, return empty array
    if (!activitiesSnapshot || activitiesSnapshot.empty) {
      return NextResponse.json({
        success: true,
        activities: [],
        count: 0,
        message: 'No activities available'
      });
    }

    for (const activityDoc of activitiesSnapshot.docs) {
      const activityId = activityDoc.id;
      
      // Skip if user has already joined
      if (joinedActivityIds.has(activityId)) {
        continue;
      }

      const activityData = activityDoc.data();
      
      // Skip past activities
      const activityDate = activityData.date?.toDate?.() || new Date(activityData.date);
      if (activityDate < now) {
        continue;
      }

      // Get attendee count from members subcollection
      let attendeeCount = 0;
      let attendees: any[] = [];
      
      try {
        const membersSnapshot = await adminDb
          .collection('activities')
          .doc(activityId)
          .collection('members')
          .get();

        attendeeCount = membersSnapshot.size;

        // Get first few attendees for avatars
        attendees = await Promise.all(
          membersSnapshot.docs.slice(0, 5).map(async (memberDoc) => {
            const memberData = memberDoc.data();
            const attendeeUserId = memberData.userId || memberDoc.id;
            
            try {
              const userDoc = await adminDb.collection('users').doc(attendeeUserId).get();
              const userData = userDoc.data();
              return {
                photoURL: userData?.photoURL || null,
                displayName: userData?.displayName || userData?.username || null,
              };
            } catch (error) {
              return {
                photoURL: null,
                displayName: null,
              };
            }
          })
        );
      } catch (error) {
        console.error('Error fetching members:', error);
        // Continue with zero attendees
      }

      // Get group information
      let groupName = activityData.groupName || null;
      const groupId = activityData.groupId || null;

      if (groupId && !groupName) {
        try {
          const groupDoc = await adminDb.collection('groups').doc(groupId).get();
          groupName = groupDoc.data()?.name || null;
        } catch (error) {
          console.error('Error fetching group:', error);
        }
      }

      discoverableActivities.push({
        id: activityId,
        name: activityData.name || activityData.title || 'Unnamed Activity',
        description: activityData.description || null,
        date: activityData.date?.toDate?.() || activityData.date,
        location: activityData.location || null,
        groupName,
        groupId,
        attendeeCount,
        attendees: attendees.filter(a => a.photoURL || a.displayName),
        maxAttendees: activityData.maxAttendees || null,
      });
    }

    // Sort by date (upcoming first)
    discoverableActivities.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      success: true,
      activities: discoverableActivities,
      count: discoverableActivities.length,
    });

  } catch (error) {
    console.error('Error in /api/compass/activities:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

