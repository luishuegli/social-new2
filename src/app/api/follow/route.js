import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    const { targetUserId, action } = await request.json();

    if (!targetUserId || !['follow', 'unfollow'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid targetUserId or action' 
      }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot follow yourself' 
      }, { status: 400 });
    }

    const batch = adminDb.batch();

    // Update follower's following list
    const followerRef = adminDb.collection('users').doc(userId);
    const followingRef = followerRef.collection('following').doc(targetUserId);

    // Update target user's followers list
    const targetRef = adminDb.collection('users').doc(targetUserId);
    const followerDocRef = targetRef.collection('followers').doc(userId);

    if (action === 'follow') {
      // Add to following/followers
      batch.set(followingRef, {
        userId: targetUserId,
        followedAt: FieldValue.serverTimestamp()
      });
      
      batch.set(followerDocRef, {
        userId: userId,
        followedAt: FieldValue.serverTimestamp()
      });

      // Update follower counts
      batch.update(followerRef, {
        followingCount: FieldValue.increment(1)
      });
      
      batch.update(targetRef, {
        followersCount: FieldValue.increment(1)
      });

    } else {
      // Remove from following/followers
      batch.delete(followingRef);
      batch.delete(followerDocRef);

      // Update follower counts
      batch.update(followerRef, {
        followingCount: FieldValue.increment(-1)
      });
      
      batch.update(targetRef, {
        followersCount: FieldValue.increment(-1)
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'follow' ? 'followed' : 'unfollowed'} user`,
      action
    });

  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing targetUserId parameter' 
      }, { status: 400 });
    }

    // Check if user is following target
    const followingDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('following')
      .doc(targetUserId)
      .get();

    const isFollowing = followingDoc.exists;

    // Get follower counts
    const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();
    const targetUserData = targetUserDoc.data();
    
    return NextResponse.json({
      success: true,
      isFollowing,
      followersCount: targetUserData?.followersCount || 0,
      followingCount: targetUserData?.followingCount || 0
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
