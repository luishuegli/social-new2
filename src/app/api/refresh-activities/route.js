import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';
import { generateRealisticActivity } from '../../../lib/activityGenerator.js';

export async function POST() {
  try {
    console.log('🔄 Refreshing activities with realistic names...');
    
    // Get all existing activities
    const activitiesSnapshot = await adminDb.collection('activities').get();
    const groupsSnapshot = await adminDb.collection('groups').get();
    
    // Create a map of group names
    const groupMap = new Map();
    groupsSnapshot.forEach(doc => {
      const data = doc.data();
      groupMap.set(doc.id, {
        name: data.groupName || data.name,
        category: data.category
      });
    });
    
    const updatedActivities = [];
    const batch = adminDb.batch();
    
    activitiesSnapshot.forEach(activityDoc => {
      const activityData = activityDoc.data();
      const groupInfo = groupMap.get(activityData.groupId);
      
      if (groupInfo) {
        // Generate realistic activity
        const realisticActivity = generateRealisticActivity(
          groupInfo.name || 'Social Group',
          groupInfo.category,
          {
            difficulty: 'Easy',
            maxDuration: 4
          }
        );
        
        // Update the activity with realistic data
        const updatedData = {
          ...activityData,
          title: realisticActivity.title,
          description: realisticActivity.description,
          location: realisticActivity.location,
          duration: realisticActivity.duration,
          difficulty: realisticActivity.difficulty,
          category: realisticActivity.category,
          emoji: realisticActivity.emoji,
          estimatedCost: realisticActivity.estimatedCost,
          maxParticipants: realisticActivity.maxParticipants,
          tags: realisticActivity.tags,
          type: realisticActivity.type,
          updatedAt: new Date()
        };
        
        batch.update(activityDoc.ref, updatedData);
        updatedActivities.push({
          activityId: activityDoc.id,
          oldTitle: activityData.title,
          newTitle: realisticActivity.title,
          category: realisticActivity.category,
          emoji: realisticActivity.emoji
        });
      }
    });
    
    // Also update the nextActivity in groups to match
    const groupBatch = adminDb.batch();
    groupsSnapshot.forEach(groupDoc => {
      const groupData = groupDoc.data();
      if (groupData.nextActivity && groupData.nextActivity.id) {
        const updatedActivity = updatedActivities.find(a => a.activityId === groupData.nextActivity.id);
        if (updatedActivity) {
          const updatedNextActivity = {
            ...groupData.nextActivity,
            title: updatedActivity.newTitle
          };
          groupBatch.update(groupDoc.ref, { nextActivity: updatedNextActivity });
        }
      }
    });
    
    // Commit both batches
    await batch.commit();
    await groupBatch.commit();
    
    console.log(`✅ Successfully updated ${updatedActivities.length} activities`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ${updatedActivities.length} activities with realistic names`,
      activities: updatedActivities
    });
    
  } catch (error) {
    console.error('❌ Error refreshing activities:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
