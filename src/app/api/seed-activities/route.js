import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';
import { generateRealisticActivity } from '../../../lib/activityGenerator.js';

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
          console.log(`Creating activity ${activityId} for group ${groupId}`);
        } else {
          console.log(`Activity ${activityId} already exists, skipping`);
          continue;
        }
        
        if (!existingActivity.exists) {
          // Generate realistic activity based on group name and category
          const realisticActivity = generateRealisticActivity(
            groupData.groupName || groupData.name || 'Social Group',
            groupData.category,
            {
              difficulty: 'Easy', // Default to easy for broad appeal
              maxDuration: 4 // Max 4 hours for most activities
            }
          );

          const activityData = {
            id: activityId,
            title: realisticActivity.title,
            description: realisticActivity.description,
            groupId: groupId,
            groupName: groupData.groupName || groupData.name || 'Unknown Group',
            date: realisticActivity.date,
            location: realisticActivity.location,
            duration: realisticActivity.duration,
            difficulty: realisticActivity.difficulty,
            category: realisticActivity.category,
            emoji: realisticActivity.emoji,
            estimatedCost: realisticActivity.estimatedCost,
            maxParticipants: realisticActivity.maxParticipants,
            tags: realisticActivity.tags,
            participants: [], // Start with empty participants
            status: 'planned',
            creatorId: groupData.createdBy || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: realisticActivity.type
          };

          await adminDb.collection('activities').doc(activityId).set(activityData);
          activities.push({ 
            activityId, 
            groupId, 
            title: activityData.title,
            category: activityData.category,
            emoji: activityData.emoji
          });
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