import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../Lib/firebaseAdmin';

export async function GET(request) {
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

    // Get all posts that this user has liked
    const postsRef = adminDb.collection('posts');
    const postsSnapshot = await postsRef.get();
    
    const likedPostIds = [];
    
    for (const postDoc of postsSnapshot.docs) {
      const likeRef = adminDb.collection('posts').doc(postDoc.id).collection('likes').doc(userId);
      const likeDoc = await likeRef.get();
      
      if (likeDoc.exists) {
        likedPostIds.push(postDoc.id);
      }
    }

    console.log(`✅ Found ${likedPostIds.length} liked posts for user ${userId}`);

    return NextResponse.json({
      success: true,
      likedPostIds
    });

  } catch (error) {
    console.error('Error fetching user likes:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}




