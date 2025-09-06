import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { activityId, groupId, userId, action } = body;

    // Validate required fields
    if (!activityId || !groupId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: activityId, groupId, userId, action' },
        { status: 400 }
      );
    }

    if (!['join', 'leave'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "join" or "leave"' },
        { status: 400 }
      );
    }

    // Check if activity exists, if not create it
    const activityRef = adminDb.collection('activities').doc(activityId);
    const activityDoc = await activityRef.get();

    if (!activityDoc.exists) {
      // Create the activity document if it doesn't exist
      // This handles the case where seeded groups reference activities that don't exist
      const groupRef = adminDb.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();
      
      if (!groupDoc.exists) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const groupData = groupDoc.data();
      const nextActivity = groupData.nextActivity;

      if (!nextActivity) {
        return NextResponse.json(
          { error: 'No next activity found for this group' },
          { status: 404 }
        );
      }

      // Create the activity document
      await activityRef.set({
        id: activityId,
        title: nextActivity.title || 'Group Activity',
        description: nextActivity.description || '',
        groupId: groupId,
        date: nextActivity.date || null,
        location: nextActivity.location || '',
        participants: action === 'join' ? [userId] : [],
        status: 'planned',
        creatorId: groupData.createdBy || userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'join' ? 'joined' : 'left'} activity`,
        activityId: activityId,
        participants: action === 'join' ? [userId] : []
      });
    }

    // Activity exists, update participants
    const activityData = activityDoc.data();
    let participants = activityData.participants || [];

    if (action === 'join') {
      if (!participants.includes(userId)) {
        participants.push(userId);
      }
    } else if (action === 'leave') {
      participants = participants.filter(id => id !== userId);
    }

    // Update the activity
    await activityRef.update({
      participants: participants,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'join' ? 'joined' : 'left'} activity`,
      activityId: activityId,
      participants: participants
    });

  } catch (error) {
    console.error('RSVP API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}