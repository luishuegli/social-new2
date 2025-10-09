import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';

export async function POST(request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = decodedToken.uid;
    
    // Check if user profile exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create user profile
      const userProfile = {
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        username: decodedToken.email?.split('@')[0] || `user${userId.slice(-4)}`,
        profilePictureUrl: decodedToken.picture || `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 99) + 1}.jpg`,
        bio: 'Welcome to my profile!',
        stats: {
          activitiesPlannedCount: 0,
          memberOfGroupCount: 0,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await adminDb.collection('users').doc(userId).set(userProfile);
      
      return NextResponse.json({
        success: true,
        message: 'User profile created',
        profile: userProfile
      });
    } else {
      // Update existing profile with any missing fields
      const existingData = userDoc.data();
      const updates = {};
      
      if (!existingData.profilePictureUrl) {
        updates.profilePictureUrl = decodedToken.picture || `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 99) + 1}.jpg`;
      }
      
      if (!existingData.displayName) {
        updates.displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
      }
      
      if (!existingData.username) {
        updates.username = decodedToken.email?.split('@')[0] || `user${userId.slice(-4)}`;
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = FieldValue.serverTimestamp();
        await adminDb.collection('users').doc(userId).update(updates);
      }
      
      return NextResponse.json({
        success: true,
        message: 'User profile ensured',
        profile: { ...existingData, ...updates }
      });
    }

  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
