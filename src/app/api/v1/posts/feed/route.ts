/**
 * API v1 - Posts Feed Endpoint
 * 
 * GET /api/v1/posts/feed
 * 
 * Returns paginated feed of posts from users the current user follows
 */

import { NextRequest } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/apiMiddleware';
import { getUsersDataAdmin } from '@/lib/userData';
import { getGroupsDataAdmin } from '@/lib/groupData';
import { paginationSchema } from '@/lib/validation';
import { RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { withCache } from '@/lib/cache';
import { trackAPIRequest } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/posts/feed
 * 
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - lastId: string (optional, for pagination)
 */
async function getFeedHandler(request: NextRequest, userId: string) {
  const startTime = Date.now();
  const track = trackAPIRequest('/api/v1/posts/feed', 'GET', startTime);

  try {
    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const lastIdParam = searchParams.get('lastId');
    
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
    const lastId = lastIdParam || undefined;

    // Get list of users that the current user follows
    const followingSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('following')
      .get();

    let followingUserIds = followingSnap.docs.map(doc => doc.id);
    followingUserIds.push(userId); // Include user's own posts

    if (followingUserIds.length === 0) {
      track(200);
      return createSuccessResponse({ posts: [], hasMore: false, count: 0 });
    }

    // Handle Firestore 'in' query limit (max 10)
    const userIdChunks = [];
    for (let i = 0; i < followingUserIds.length; i += 10) {
      userIdChunks.push(followingUserIds.slice(i, i + 10));
    }

    // Get the last post document for pagination if provided
    let lastPostDoc = null;
    if (lastId) {
      lastPostDoc = await adminDb.collection('posts').doc(lastId).get();
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
    const allPosts: Array<{ id: string; data: any; createdAt: any }> = [];
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
      track(200);
      return createSuccessResponse({ posts: [], hasMore: false, count: 0 });
    }

    // Batch fetch all unique author IDs using centralized utility
    const uniqueAuthorIds = [...new Set(posts.map(post => post.data.authorId))];
    const authorsMap = await getUsersDataAdmin(uniqueAuthorIds);

    // Batch fetch all unique group IDs using centralized utility
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

    // Batch fetch comment counts
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

    track(200);
    return createSuccessResponse({
      posts: formattedPosts,
      hasMore,
      count: formattedPosts.length
    });

  } catch (error: any) {
    logger.error('Error fetching feed', error, 'posts-feed');
    track(500);
    return createErrorResponse(
      'Internal Server Error',
      'Failed to fetch feed',
      500,
      'FEED_FETCH_ERROR',
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
    );
  }
}

// Export with middleware
export const GET = withAuth(
  getFeedHandler,
  {
    rateLimit: RATE_LIMIT_CONFIG.api.posts.read,
    validateQuery: paginationSchema,
  }
);
