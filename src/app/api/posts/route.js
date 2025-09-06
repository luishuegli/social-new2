import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';
import { handleAPIError, APIError } from '../../utils/errorHandler';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const maxPosts = limitParam ? parseInt(limitParam, 10) : 20;

    if (maxPosts > 100) {
      throw new APIError('Limit cannot exceed 100 posts', 400, 'LIMIT_EXCEEDED');
    }

    let snapshot;
    try {
      // Try Admin SDK first
      snapshot = await adminDb
        .collection('posts')
        .orderBy('timestamp', 'desc')
        .limit(maxPosts)
        .get();
    } catch (adminError) {
      // Fallback: use Web SDK on the server with public env vars
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new APIError('Server cannot access Firestore: missing Firebase env vars', 500, 'FIREBASE_ENV_MISSING');
      }

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const db = getFirestore(app);
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'), limit(maxPosts));
      snapshot = await getDocs(q);
    }
    const posts = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({
        id: docSnap.id,
        userName: data.authorName || data.authorId || 'Anonymous User',
        userAvatar: data.authorAvatar || '',
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        content: data.description || data.activityTitle || '',
        imageUrl: data.media?.[0]?.url || data.imageUrl || null,
        likes: data.likes || 0,
        comments: data.comments || 0,
        isLiked: false, // Will be determined by client-side auth state
        postType: data.postType || 'Individual',
        authenticityType: data.authenticityType || 'Live Post',
        groupName: data.groupName || null,
        participants: data.participants || null,
      });
    });

    return NextResponse.json({
      success: true,
      posts: posts,
      count: posts.length
    });

  } catch (error) {
    return handleAPIError(error, 'Fetch Posts');
  }
}

