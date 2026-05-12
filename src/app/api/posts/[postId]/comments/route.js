import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';
import { getUsersDataAdmin } from '@/lib/userData';
import { logger } from '@/lib/logger';

// GET /api/posts/[postId]/comments
export async function GET(_request, { params }) {
  try {
    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Missing postId' }, { status: 400 });
    }

    // List latest 200 comments ascending by createdAt
    const commentsSnap = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(200)
      .get();

    const commentsData = commentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fetch user data for all comment authors (single source of truth)
    const authorIds = [...new Set(commentsData.map(c => c.authorId).filter(Boolean))];
    const authorsMap = await getUsersDataAdmin(authorIds);

    // Enrich comments with user data from users collection
    // Ignore any denormalized authorName/authorAvatar in comments
    const comments = commentsData.map(comment => {
      const authorData = authorsMap.get(comment.authorId);
      
      return {
        id: comment.id,
        text: comment.text,
        authorId: comment.authorId,
        // Always fetch from users collection, never use denormalized data
        authorName: authorData?.displayName || 'User',
        authorAvatar: authorData?.profilePictureUrl || '',
        createdAt: comment.createdAt,
      };
    });

    return NextResponse.json({ success: true, comments, count: comments.length });
  } catch (error) {
    logger.error('GET comments failed', error, 'comments-api');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/posts/[postId]/comments
export async function POST(request, { params }) {
  try {
    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ success: false, error: 'Missing postId' }, { status: 400 });
    }

    // Auth required
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No auth token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const text = (body?.text || '').toString().trim();
    if (!text) {
      return NextResponse.json({ success: false, error: 'Comment text required' }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ success: false, error: 'Comment too long (max 2000 chars)' }, { status: 400 });
    }

    // IMPORTANT: Only store authorId, NOT authorName/authorAvatar
    // User data should always be fetched from users collection when displaying
    const comment = {
      text,
      authorId: decoded.uid, // Only store ID, fetch user data when displaying
      // DO NOT store: authorName, authorAvatar (these are in users collection)
      createdAt: FieldValue.serverTimestamp(),
    };

    const commentsCol = adminDb.collection('posts').doc(postId).collection('comments');
    const commentRef = await commentsCol.add(comment);

    // Increment comment counter on post
    await adminDb.collection('posts').doc(postId).update({
      comments: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});

    return NextResponse.json({ success: true, id: commentRef.id });
  } catch (error) {
    logger.error('POST comment failed', error, 'comments-api');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}




