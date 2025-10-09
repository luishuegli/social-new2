import { NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

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

    if (!['join', 'leave', 'maybe'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "join", "leave" or "maybe"' },
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
        interested: action === 'maybe' ? [userId] : [],
        left: action === 'leave' ? [userId] : [],
        status: 'planned',
        creatorId: groupData.createdBy || userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'join' ? 'joined' : action === 'leave' ? 'left' : 'marked as maybe'} activity`,
        activityId: activityId,
        participants: action === 'join' ? [userId] : [],
        interested: action === 'maybe' ? [userId] : [],
        left: action === 'leave' ? [userId] : []
      });
    }

    // Activity exists, update participants
    const activityData = activityDoc.data();
    let participants = activityData.participants || [];
    let interested = activityData.interested || [];
    let left = activityData.left || [];

    if (action === 'join') {
      if (!participants.includes(userId)) {
        participants.push(userId);
      }
      // remove from other buckets
      interested = interested.filter(id => id !== userId);
      left = left.filter(id => id !== userId);
    } else if (action === 'leave') {
      participants = participants.filter(id => id !== userId);
      if (!left.includes(userId)) left.push(userId);
      interested = interested.filter(id => id !== userId);
    } else if (action === 'maybe') {
      if (!interested.includes(userId)) interested.push(userId);
      participants = participants.filter(id => id !== userId);
      left = left.filter(id => id !== userId);
    }

    // Update the activity
    await activityRef.update({
      participants,
      interested,
      left,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'join' ? 'joined' : action === 'leave' ? 'left' : 'marked as maybe'} activity`,
      activityId: activityId,
      participants,
      interested,
      left
    });

  } catch (error) {
    console.error('RSVP API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}