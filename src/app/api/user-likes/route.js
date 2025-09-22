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
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    // If postId is provided, check if this specific post is liked
    if (postId) {
      const likeRef = adminDb.collection('posts').doc(postId).collection('likes').doc(userId);
      const likeDoc = await likeRef.get();
      const isLiked = likeDoc.exists;

      // Also get the current like count for this post
      const postRef = adminDb.collection('posts').doc(postId);
      const postDoc = await postRef.get();
      const likeCount = postDoc.exists ? (postDoc.data()?.likes || 0) : 0;

      return NextResponse.json({
        success: true,
        isLiked,
        likeCount
      });
    }

    // If no postId, get all posts that this user has liked
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




