import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';

// Comprehensive dev-only seeding endpoint: creates sample users, posts, comments, and likes.
// Usage:
//   curl -X POST http://localhost:3000/api/seed-basic
//   curl -X POST http://localhost:3002/api/seed-basic
// Optional: Send an Authorization: Bearer <idToken> header to also ensure the current
// user's profile exists and is used as the author for a couple of sample posts.

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Try to pick up the caller's userId if provided
    let callerUserId = null;
    let callerProfile = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        callerUserId = decoded.uid;
        const userRecord = await adminAuth.getUser(callerUserId);
        const userRef = adminDb.collection('users').doc(callerUserId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          await userRef.set({
            uid: callerUserId,
            displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'Dev User',
            email: userRecord.email || '',
            username: (userRecord.displayName || userRecord.email || `user${callerUserId.substring(0, 5)}`)
              .toLowerCase().replace(/\s/g, ''),
            profilePictureUrl: userRecord.photoURL || '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        callerProfile = (await userRef.get()).data();
      } catch (e) {
        // Ignore invalid tokens; proceed without caller
        console.warn('seed-basic: invalid token provided, proceeding without caller context');
      }
    }

    // Create comprehensive demo users with profile pictures
    const demoUsers = [
      { 
        uid: 'demo_alex', 
        displayName: 'Alex Johnson', 
        email: 'alex@example.com', 
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        username: 'alexjohnson'
      },
      { 
        uid: 'demo_sam', 
        displayName: 'Sam Rivera', 
        email: 'sam@example.com', 
        photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        username: 'samrivera'
      },
      { 
        uid: 'demo_maya', 
        displayName: 'Maya Chen', 
        email: 'maya@example.com', 
        photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        username: 'mayachen'
      },
      { 
        uid: 'demo_jordan', 
        displayName: 'Jordan Smith', 
        email: 'jordan@example.com', 
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        username: 'jordansmith'
      },
    ];

    for (const du of demoUsers) {
      const ref = adminDb.collection('users').doc(du.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          uid: du.uid,
          displayName: du.displayName,
          email: du.email,
          username: du.username,
          profilePictureUrl: du.photoURL,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Clear existing posts to ensure fresh seeding
    const postsCol = adminDb.collection('posts');
    const existingPosts = await postsCol.get();
    for (const doc of existingPosts.docs) {
      await doc.ref.delete();
    }

    // Create comprehensive sample posts
    const authors = [
      callerUserId ? callerUserId : 'demo_alex',
      'demo_sam',
      'demo_maya',
      'demo_jordan',
    ];

    const samplePosts = [
      {
        authorId: authors[0],
        text: 'Just finished building this amazing social platform! 🚀 The profile picture cropping feature is so smooth now.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&auto=format&fit=crop',
      },
      {
        authorId: authors[1],
        text: 'Beautiful sunset from my hike today! Nature never fails to amaze me 🌅',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
      },
      {
        authorId: authors[2],
        text: 'Coffee and code - the perfect combination ☕️ Working on some exciting new features!',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop',
      },
      {
        authorId: authors[3],
        text: 'Team dinner was amazing! Great food and even better company 🍽️',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop',
      },
      {
        authorId: authors[0],
        text: 'Testing the new like and comment system - it works perfectly! 👏',
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80&auto=format&fit=crop',
      },
    ];

    const createdPostIds = [];
    for (const p of samplePosts) {
      const postRef = await postsCol.add({
        authorId: p.authorId,
        text: p.text,
        imageUrl: p.imageUrl,
        likes: 0,
        comments: 0,
        visibility: 'public',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      createdPostIds.push(postRef.id);
    }

    // Add comments to posts
    const comments = [
      { postIndex: 0, authorId: 'demo_sam', text: 'This looks incredible! Great work! 🔥' },
      { postIndex: 0, authorId: 'demo_maya', text: 'The UI is so clean and intuitive!' },
      { postIndex: 1, authorId: 'demo_jordan', text: 'Amazing view! Where was this taken?' },
      { postIndex: 1, authorId: 'demo_alex', text: 'Nature is the best inspiration 🌿' },
      { postIndex: 2, authorId: 'demo_sam', text: 'Coffee and code - my daily routine too! ☕️' },
      { postIndex: 3, authorId: 'demo_maya', text: 'That food looks delicious! 😋' },
      { postIndex: 4, authorId: 'demo_jordan', text: 'The interactions feel so smooth!' },
    ];

    for (const comment of comments) {
      const postId = createdPostIds[comment.postIndex];
      if (postId) {
        const postRef = postsCol.doc(postId);
        const commentsRef = postRef.collection('comments');
        const authorProfile = (await adminDb.collection('users').doc(comment.authorId).get()).data();
        
        await commentsRef.add({
          text: comment.text,
          authorId: comment.authorId,
          authorName: authorProfile?.displayName || 'User',
          authorAvatar: authorProfile?.profilePictureUrl || '',
          createdAt: FieldValue.serverTimestamp(),
        });
        
        await postRef.update({ comments: FieldValue.increment(1) });
      }
    }

    // Add some likes to posts
    const likes = [
      { postIndex: 0, userIds: ['demo_sam', 'demo_maya', 'demo_jordan'] },
      { postIndex: 1, userIds: ['demo_alex', 'demo_maya'] },
      { postIndex: 2, userIds: ['demo_sam', 'demo_jordan'] },
      { postIndex: 3, userIds: ['demo_alex', 'demo_sam', 'demo_maya'] },
      { postIndex: 4, userIds: ['demo_sam', 'demo_maya', 'demo_jordan'] },
    ];

    for (const like of likes) {
      const postId = createdPostIds[like.postIndex];
      if (postId) {
        const postRef = postsCol.doc(postId);
        const likesRef = postRef.collection('likes');
        
        for (const userId of like.userIds) {
          await likesRef.doc(userId).set({
            userId,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        
        await postRef.update({ likes: like.userIds.length });
      }
    }

    const result = {
      success: true,
      createdPosts: samplePosts.length,
      createdComments: comments.length,
      totalLikes: likes.reduce((sum, like) => sum + like.userIds.length, 0),
      callerLinked: Boolean(callerUserId),
      message: 'Database seeded with comprehensive demo data!'
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in seed-basic:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


