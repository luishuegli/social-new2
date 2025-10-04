// src/app/api/health-check/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Test database connectivity
    const groupsSnapshot = await adminDb.collection('groups').limit(1).get();
    const dbLatency = Date.now() - startTime;
    
    // Test username query performance
    const usernameStart = Date.now();
    const usernameQuery = await adminDb.collection('groups')
      .where('username', '==', 'mountainadventurers1')
      .limit(1)
      .get();
    const usernameLatency = Date.now() - usernameStart;
    
    // Get basic stats
    const totalGroups = await adminDb.collection('groups').count().get();
    const groupsWithUsernames = await adminDb.collection('groups')
      .where('username', '!=', null)
      .count()
      .get();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      performance: {
        dbLatency: `${dbLatency}ms`,
        usernameQueryLatency: `${usernameLatency}ms`,
        totalGroups: totalGroups.data().count,
        groupsWithUsernames: groupsWithUsernames.data().count,
        usernameCoverage: `${Math.round((groupsWithUsernames.data().count / totalGroups.data().count) * 100)}%`
      },
      checks: {
        database: 'connected',
        usernameQueries: 'working',
        migration: groupsWithUsernames.data().count === totalGroups.data().count ? 'complete' : 'incomplete'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}








