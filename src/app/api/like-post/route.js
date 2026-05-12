import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';
import { logger } from '@/lib/logger';

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
      logger.error('Token verification failed', error, 'like-post');
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

    // Use transaction to atomically update like count and like document
    // This prevents race conditions when multiple users like simultaneously
    const likeRef = adminDb.collection('posts').doc(postId).collection('likes').doc(userId);
    
    await adminDb.runTransaction(async (transaction) => {
      // Get current post data within transaction
      const postDoc = await transaction.get(postRef);
      
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      const currentLikes = postData.likes || 0;
      
      // Check if user already liked (to prevent double-liking)
      const likeDoc = await transaction.get(likeRef);
      const alreadyLiked = likeDoc.exists;
      
      // Calculate new like count atomically
      let newLikeCount;
      if (isLiked) {
        // Only increment if not already liked
        newLikeCount = alreadyLiked ? currentLikes : currentLikes + 1;
      } else {
        // Only decrement if currently liked
        newLikeCount = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes;
      }
      
      // Atomically update both the counter and the like document
      transaction.update(postRef, {
        likes: newLikeCount,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      if (isLiked && !alreadyLiked) {
        transaction.set(likeRef, {
          userId,
          likedAt: FieldValue.serverTimestamp()
        });
      } else if (!isLiked && alreadyLiked) {
        transaction.delete(likeRef);
      }
    });

    // Get final count for response (transaction already committed)
    const finalPostDoc = await postRef.get();
    const finalLikeCount = finalPostDoc.data()?.likes || 0;

    return NextResponse.json({
      success: true,
      message: `Post ${isLiked ? 'liked' : 'unliked'} successfully`,
      newLikeCount: finalLikeCount,
      isLiked
    });

  } catch (error) {
    logger.error('Error liking post', error, 'like-post');
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}














