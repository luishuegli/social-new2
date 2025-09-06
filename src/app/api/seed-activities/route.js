import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';

export async function POST() {
  try {
    // Get all groups to create matching activities
    const groupsSnapshot = await adminDb.collection('groups').get();
    const activities = [];

    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;

      // Create activity based on the group's nextActivity
      if (groupData.nextActivity && groupData.nextActivity.id) {
        const activityId = groupData.nextActivity.id;
        
        // Check if activity already exists
        const existingActivity = await adminDb.collection('activities').doc(activityId).get();
        
        if (!existingActivity.exists) {
          const activityData = {
            id: activityId,
            title: groupData.nextActivity.title || 'Group Activity',
            description: groupData.nextActivity.description || `Upcoming activity for ${groupData.name || 'Unknown Group'}`,
            groupId: groupId,
            groupName: groupData.name || 'Unknown Group',
            date: groupData.nextActivity.date || null,
            location: groupData.nextActivity.location || '',
            participants: [], // Start with empty participants
            status: 'planned',
            creatorId: groupData.createdBy || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'group_activity'
          };

          await adminDb.collection('activities').doc(activityId).set(activityData);
          activities.push({ activityId, groupId, title: activityData.title });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${activities.length} activities`,
      activities: activities
    });

  } catch (error) {
    console.error('Seed activities error:', error);
    return NextResponse.json(
      { error: 'Failed to seed activities', details: error.message },
      { status: 500 }
    );
  }
}