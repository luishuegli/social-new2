import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';
import { withRateLimit, RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { getUsersDataAdmin } from '@/lib/userData';
import { getGroupsDataAdmin } from '@/lib/groupData';
import { logger } from '@/lib/logger';

/**
 * Optimized feed endpoint that handles N+1 queries efficiently
 * and supports users following more than 10 people
 */
const getFeedHandler = async (request) => {
  try {
    // Authentication check
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50 for performance
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

    // Handle the Firestore 'in' query limit by chunking into groups of 10
    const userIdChunks = [];
    for (let i = 0; i < followingUserIds.length; i += 10) {
      userIdChunks.push(followingUserIds.slice(i, i + 10));
    }

    // Get the last post document for pagination if provided
    let lastPostDoc = null;
    if (lastPostId) {
      lastPostDoc = await adminDb.collection('posts').doc(lastPostId).get();
      if (!lastPostDoc.exists) {
        lastPostDoc = null;
      }
    }

    // Execute queries for each chunk in parallel
    const chunkQueries = userIdChunks.map(chunk => {
      let query = adminDb
        .collection('posts')
        .where('authorId', 'in', chunk)
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (lastPostDoc) {
        query = query.startAfter(lastPostDoc);
      }
      
      return query.get();
    });

    const chunkResults = await Promise.all(chunkQueries);
    
    // Merge and sort all posts from different chunks
    const allPosts = [];
    chunkResults.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        allPosts.push({
          id: doc.id,
          data: doc.data(),
          createdAt: doc.data().createdAt
        });
      });
    });

    // Sort merged results by createdAt (newest first)
    allPosts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Take only the limit amount of posts
    const posts = allPosts.slice(0, limit);

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
        hasMore: false
      });
    }

    // Batch fetch all unique author IDs using centralized utility
    // This ensures we always fetch from the single source of truth: users collection
    const uniqueAuthorIds = [...new Set(posts.map(post => post.data.authorId))];
    const authorsMap = await getUsersDataAdmin(uniqueAuthorIds);

    // Batch fetch all unique group IDs using centralized utility
    // This ensures we always fetch from the single source of truth: groups collection
    const uniqueGroupIds = [...new Set(posts.map(post => post.data.groupId).filter(Boolean))];
    const groupsMap = await getGroupsDataAdmin(uniqueGroupIds);

    // Batch fetch all likes for the current user
    const likeRefs = posts.map(post => 
      adminDb
        .collection('posts')
        .doc(post.id)
        .collection('likes')
        .doc(userId)
    );
    const likeDocs = await adminDb.getAll(...likeRefs);
    
    // Create a map for quick like lookup
    const likesMap = new Map();
    likeDocs.forEach((doc, index) => {
      likesMap.set(posts[index].id, doc.exists);
    });

    // Batch fetch comment counts (we'll denormalize this in the future)
    // For now, we'll use a transaction to get counts more efficiently
    const commentCounts = await Promise.all(
      posts.map(post =>
        adminDb
          .collection('posts')
          .doc(post.id)
          .collection('comments')
          .count()
          .get()
          .then(snapshot => ({ id: post.id, count: snapshot.data().count }))
      )
    );
    
    // Create a map for quick comment count lookup
    const commentsMap = new Map();
    commentCounts.forEach(item => {
      commentsMap.set(item.id, item.count);
    });

    // Build the final posts array with all data
    // Always use data from users collection (single source of truth)
    // Ignore any denormalized authorName/authorAvatar in posts
    const formattedPosts = posts.map(post => {
      const authorData = authorsMap.get(post.data.authorId);
      const isLiked = likesMap.get(post.id) || false;
      const commentCount = commentsMap.get(post.id) || 0;

      // Use centralized user data, never fall back to denormalized data
      const authorName = authorData?.displayName || 'User';
      const authorAvatar = authorData?.profilePictureUrl || '';
      const username = authorData?.username || '';

      // Use centralized group data, never fall back to denormalized data
      const groupData = post.data.groupId ? groupsMap.get(post.data.groupId) : null;
      const groupName = groupData?.name || null;

      return {
        id: post.id,
        authorId: post.data.authorId,
        authorName, // Always from users collection
        authorAvatar, // Always from users collection
        username, // Always from users collection
        content: post.data.content || post.data.description || '',
        imageUrl: post.data.imageUrl || post.data.media?.[0]?.url || '',
        createdAt: post.data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        likes: post.data.likes || 0,
        comments: commentCount,
        isLiked: isLiked,
        postType: post.data.postType || 'Individual',
        authenticityType: post.data.authenticityType || 'Live Post',
        groupId: post.data.groupId || null,
        groupName, // Always from groups collection (single source of truth)
        activityId: post.data.activityId || null
      };
    });

    const hasMore = allPosts.length > limit;

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      hasMore,
      count: formattedPosts.length
    });

  } catch (error) {
    logger.error('Error fetching feed', error, 'posts-feed');
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch feed' 
    }, { status: 500 });
  }
}

// Export with rate limiting - 100 requests per minute for feed
export const GET = withRateLimit(getFeedHandler, RATE_LIMIT_CONFIG.api.posts.read);