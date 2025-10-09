import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';

export async function POST() {
  try {
    console.log('🔧 Starting to fix missing activities...');
    
    // Get all groups
    const groupsSnapshot = await adminDb.collection('groups').get();
    const activitiesSnapshot = await adminDb.collection('activities').get();
    
    // Create a set of existing activity IDs
    const existingActivityIds = new Set();
    activitiesSnapshot.forEach(doc => {
      existingActivityIds.add(doc.id);
    });
    
    const missingActivities = [];
    const groupsToUpdate = [];
    
    // Check each group for missing activities
    groupsSnapshot.forEach(groupDoc => {
      const groupData = groupDoc.data();
      const nextActivity = groupData.nextActivity;
      
      if (nextActivity && nextActivity.id && !existingActivityIds.has(nextActivity.id)) {
        // Activity is referenced but doesn't exist
        missingActivities.push({
          id: nextActivity.id,
          groupId: groupDoc.id,
          groupData,
          nextActivity
        });
      }
    });
    
    console.log(`📊 Found ${missingActivities.length} missing activities to create`);
    
    // Create missing activities
    const batch = adminDb.batch();
    let createdCount = 0;
    
    for (const missing of missingActivities) {
      const activityRef = adminDb.collection('activities').doc(missing.id);
      
      const activityData = {
        id: missing.id,
        title: missing.nextActivity.title || 'Group Activity',
        description: missing.nextActivity.description || '',
        groupId: missing.groupId,
        date: missing.nextActivity.date || null,
        location: missing.nextActivity.location || '',
        participants: [], // Start with empty participants
        status: 'planned',
        creatorId: missing.groupData.createdBy || 'system',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        type: missing.nextActivity.type || 'event'
      };
      
      batch.set(activityRef, activityData);
      createdCount++;
      
      console.log(`✅ Prepared activity: ${missing.id} for group: ${missing.groupId}`);
    }
    
    if (createdCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully created ${createdCount} missing activities`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${createdCount} missing activities`,
      details: {
        totalGroups: groupsSnapshot.size,
        existingActivities: existingActivityIds.size,
        missingActivities: missingActivities.length,
        createdActivities: createdCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing missing activities:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Just analyze without fixing
    const groupsSnapshot = await adminDb.collection('groups').get();
    const activitiesSnapshot = await adminDb.collection('activities').get();
    
    const existingActivityIds = new Set();
    activitiesSnapshot.forEach(doc => {
      existingActivityIds.add(doc.id);
    });
    
    const analysis = {
      totalGroups: groupsSnapshot.size,
      existingActivities: existingActivityIds.size,
      groupsWithNextActivity: 0,
      missingActivities: []
    };
    
    groupsSnapshot.forEach(groupDoc => {
      const groupData = groupDoc.data();
      const nextActivity = groupData.nextActivity;
      
      if (nextActivity && nextActivity.id) {
        analysis.groupsWithNextActivity++;
        
        if (!existingActivityIds.has(nextActivity.id)) {
          analysis.missingActivities.push({
            activityId: nextActivity.id,
            groupId: groupDoc.id,
            groupName: groupData.groupName,
            activityTitle: nextActivity.title
          });
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Error analyzing activities:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}






