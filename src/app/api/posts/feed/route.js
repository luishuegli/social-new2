import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const lastPostId = searchParams.get('lastPostId');

    // Get list of users that the current user follows
    const followingSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('following')
      .get();

    const followingUserIds = followingSnap.docs.map(doc => doc.id);
    
    // Include the user's own posts in the feed
    followingUserIds.push(userId);

    if (followingUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
        hasMore: false
      });
    }

    // Query posts from followed users
    let postsQuery = adminDb
      .collection('posts')
      .where('authorId', 'in', followingUserIds.slice(0, 10)) // Firestore 'in' limit is 10
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // If there are more than 10 users followed, we need multiple queries
    if (followingUserIds.length > 10) {
      // For now, just use the first 10. In production, you'd want to implement
      // a more sophisticated approach or use a different database structure
      console.warn('User follows more than 10 people, limiting to first 10');
    }

    if (lastPostId) {
      const lastPostDoc = await adminDb.collection('posts').doc(lastPostId).get();
      if (lastPostDoc.exists) {
        postsQuery = postsQuery.startAfter(lastPostDoc);
      }
    }

    const postsSnap = await postsQuery.get();
    
    // Get user details for each post author
    const posts = await Promise.all(postsSnap.docs.map(async (doc) => {
      const data = doc.data();
      
      // Get author details
      const authorDoc = await adminDb.collection('users').doc(data.authorId).get();
      const authorData = authorDoc.data();

      // Check if current user liked this post
      const likeDoc = await adminDb
        .collection('posts')
        .doc(doc.id)
        .collection('likes')
        .doc(userId)
        .get();

      // Get comment count
      const commentsSnap = await adminDb
        .collection('posts')
        .doc(doc.id)
        .collection('comments')
        .get();

      return {
        id: doc.id,
        authorId: data.authorId,
        authorName: authorData?.displayName || data.authorName || 'User',
        authorAvatar: authorData?.profilePictureUrl || data.authorAvatar || '',
        username: authorData?.username || '',
        content: data.content || data.description || '',
        imageUrl: data.imageUrl || data.media?.[0]?.url || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        likes: data.likes || 0,
        comments: commentsSnap.size,
        isLiked: likeDoc.exists,
        postType: data.postType || 'Individual',
        authenticityType: data.authenticityType || 'Live Post',
        groupId: data.groupId || null,
        groupName: data.groupName || null,
        activityId: data.activityId || null
      };
    }));

    const hasMore = postsSnap.docs.length === limit;

    return NextResponse.json({
      success: true,
      posts,
      hasMore,
      count: posts.length
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
