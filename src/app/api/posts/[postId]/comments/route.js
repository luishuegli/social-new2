import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '../../../../Lib/firebaseAdmin';

// GET /api/posts/[postId]/comments
export async function GET(_request, { params }) {
  try {
    const { postId } = params || {};
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

    const comments = commentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, comments, count: comments.length });
  } catch (error) {
    console.error('GET comments failed', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/posts/[postId]/comments
export async function POST(request, { params }) {
  try {
    const { postId } = params || {};
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

    const comment = {
      text,
      authorId: decoded.uid,
      authorName: decoded.name || decoded.email || 'User',
      authorAvatar: decoded.picture || '',
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
    console.error('POST comment failed', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}




