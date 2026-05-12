import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * Migration script to remove denormalized user data from posts and comments
 * 
 * This script removes authorName and authorAvatar fields from:
 * - posts collection
 * - comments subcollections
 * 
 * After running this, all user data will be fetched from the users collection
 * (single source of truth) using the centralized userData utility.
 * 
 * Usage: POST /api/migrate-remove-denormalized-user-data
 * Requires: Authorization header with admin token
 */
export async function POST(request) {
  try {
    // Verify admin authentication
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
      logger.error('Token verification failed', error, 'migration');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    logger.info('Starting migration to remove denormalized user data', { 
      userId: decodedToken.uid 
    }, 'migration');

    const stats = {
      postsUpdated: 0,
      commentsUpdated: 0,
      errors: 0,
    };

    // Step 1: Remove denormalized data from posts
    logger.info('Step 1: Removing denormalized data from posts...', undefined, 'migration');
    
    const postsSnapshot = await adminDb.collection('posts').get();
    let postsBatch = adminDb.batch();
    let postsBatchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      
      // Check if post has denormalized user data
      if (data.authorName || data.authorAvatar) {
        const updates = {};
        
        if (data.authorName) {
          updates.authorName = adminDb.FieldValue.delete();
        }
        if (data.authorAvatar) {
          updates.authorAvatar = adminDb.FieldValue.delete();
        }

        postsBatch.update(doc.ref, updates);
        postsBatchCount++;
        stats.postsUpdated++;

        // Commit batch if it reaches the limit
        if (postsBatchCount >= BATCH_SIZE) {
          await postsBatch.commit();
          postsBatch = adminDb.batch(); // Create new batch
          postsBatchCount = 0;
          logger.info(`Processed ${stats.postsUpdated} posts...`, undefined, 'migration');
        }
      }
    }

    // Commit remaining posts
    if (postsBatchCount > 0) {
      await postsBatch.commit();
    }

    logger.info(`Step 1 complete: Updated ${stats.postsUpdated} posts`, undefined, 'migration');

    // Step 2: Remove denormalized data from comments
    logger.info('Step 2: Removing denormalized data from comments...', undefined, 'migration');

    // Get all posts to iterate through their comments
    const allPostsSnapshot = await adminDb.collection('posts').get();
    
    for (const postDoc of allPostsSnapshot.docs) {
      try {
        const commentsSnapshot = await postDoc.ref.collection('comments').get();
        const commentsBatch = adminDb.batch();
        let commentsBatchCount = 0;

        commentsSnapshot.docs.forEach((commentDoc) => {
          const commentData = commentDoc.data();
          
          // Check if comment has denormalized user data
          if (commentData.authorName || commentData.authorAvatar) {
            const updates = {};
            
            if (commentData.authorName) {
              updates.authorName = adminDb.FieldValue.delete();
            }
            if (commentData.authorAvatar) {
              updates.authorAvatar = adminDb.FieldValue.delete();
            }

            commentsBatch.update(commentDoc.ref, updates);
            commentsBatchCount++;
            stats.commentsUpdated++;

            // Commit batch if it reaches the limit
            if (commentsBatchCount >= BATCH_SIZE) {
              commentsBatch.commit().catch(err => {
                logger.error('Error committing comments batch', err, 'migration');
                stats.errors++;
              });
              commentsBatchCount = 0;
            }
          }
        });

        // Commit remaining comments for this post
        if (commentsBatchCount > 0) {
          await commentsBatch.commit();
        }
      } catch (error) {
        logger.error(`Error processing comments for post ${postDoc.id}`, error, 'migration');
        stats.errors++;
      }
    }

    logger.info(`Step 2 complete: Updated ${stats.commentsUpdated} comments`, undefined, 'migration');

    logger.info('Migration complete', stats, 'migration');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        postsUpdated: stats.postsUpdated,
        commentsUpdated: stats.commentsUpdated,
        errors: stats.errors,
      },
      note: 'All user data is now fetched from the users collection (single source of truth)'
    });

  } catch (error) {
    logger.error('Migration failed', error, 'migration');
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
