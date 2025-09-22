import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '../../Lib/firebaseAdmin';

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
    const { postId, isLiked } = await request.json();

    if (!postId || typeof isLiked !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid postId or isLiked parameter' 
      }, { status: 400 });
    }

    // Get the post document
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      }, { status: 404 });
    }

    const postData = postDoc.data();
    const currentLikes = postData.likes || 0;

    // Update the post's like count
    const newLikeCount = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    
    await postRef.update({
      likes: newLikeCount,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update the user's like in the likes subcollection
    const likeRef = adminDb.collection('posts').doc(postId).collection('likes').doc(userId);
    
    if (isLiked) {
      await likeRef.set({
        userId,
        likedAt: FieldValue.serverTimestamp()
      });
    } else {
      await likeRef.delete();
    }

    console.log(`✅ Post ${postId} ${isLiked ? 'liked' : 'unliked'} by user ${userId}. New count: ${newLikeCount}`);

    return NextResponse.json({
      success: true,
      message: `Post ${isLiked ? 'liked' : 'unliked'} successfully`,
      newLikeCount,
      isLiked
    });

  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}




