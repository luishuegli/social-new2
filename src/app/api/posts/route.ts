import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';
import { handleAPIError, APIError } from '../../utils/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const groupId = searchParams.get('groupId');
    const activityId = searchParams.get('activityId');
    const maxPosts = limitParam ? parseInt(limitParam, 10) : 20;

    if (maxPosts > 100) {
      throw new APIError('Limit cannot exceed 100 posts', 400, 'LIMIT_EXCEEDED');
    }

    let snapshot;
    try {
      // Try Admin SDK first
      let queryRef = adminDb.collection('posts');

      // Apply filters if provided
      if (groupId) {
        queryRef = queryRef.where('groupId', '==', groupId);
      }
      if (activityId) {
        queryRef = queryRef.where('activityId', '==', activityId);
      }

      queryRef = queryRef.orderBy('timestamp', 'desc').limit(maxPosts);
      snapshot = await queryRef.get();

      if (snapshot.empty) {
        return NextResponse.json({ 
          posts: [], 
          totalCount: 0,
          message: 'No posts found',
          timestamp: new Date().toISOString()
        });
      }

      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        };
      });

      return NextResponse.json({ 
        posts, 
        totalCount: posts.length,
        message: 'Posts retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (adminError: any) {
      console.log('Admin SDK failed, trying client SDK fallback:', adminError.message);
      
      try {
        // Fallback to client SDK
        const { db } = await import('../../Lib/firebase');
        const { collection, query, orderBy, limit, where, getDocs } = await import('firebase/firestore');

        let q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(maxPosts));

        if (groupId) {
          q = query(collection(db, 'posts'), where('groupId', '==', groupId), orderBy('timestamp', 'desc'), limit(maxPosts));
        }
        if (activityId) {
          q = query(collection(db, 'posts'), where('activityId', '==', activityId), orderBy('timestamp', 'desc'), limit(maxPosts));
        }

        const clientSnapshot = await getDocs(q);
        
        if (clientSnapshot.empty) {
          return NextResponse.json({ 
            posts: [], 
            totalCount: 0,
            message: 'No posts found',
            timestamp: new Date().toISOString()
          });
        }

        const posts = clientSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id.length > 8 ? doc.id : doc.ref.path,
            ...data,
            timestamp: data.timestamp?.toDate?.() || data.timestamp,
            createdAt: data.createdAt?.toDate?.() || data.createdAt
          };
        });

        return NextResponse.json({ 
          posts, 
          totalCount: posts.length,
          message: 'Posts retrieved successfully (client SDK)',
          timestamp: new Date().toISOString()
        });

      } catch (clientError: any) {
        console.error('Client SDK also failed:', clientError.message);
        throw new APIError(
          'Both Firebase SDKs failed to retrieve posts',
          500,
          'FIREBASE_ERROR'
        );
      }
    }

  } catch (error: any) {
    console.error('Posts API Error:', error);
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      authorId, 
      content, 
      imageUrl, 
      groupId, 
      activityId,
      authenticityType = 'Live Post'
    } = body;

    // Validation
    if (!authorId) {
      throw new APIError('Author ID is required', 400, 'MISSING_AUTHOR');
    }

    try {
      // Create post using Admin SDK
      const newPost = {
        authorId,
        content: content || '',
        imageUrl: imageUrl || '',
        groupId: groupId || '',
        activityId: activityId || '',
        authenticityType: authenticityType || 'Live Post',
        likes: 0,
        isLiked: false,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      const docRef = await adminDb.collection('posts').add(newPost);

      return NextResponse.json({ 
        success: true, 
        postId: docRef.id,
        message: 'Post created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (adminError: any) {
      console.log('Admin SDK failed, trying client SDK fallback:', adminError.message);
      
      // Note: Client SDK usually can't write due to security rules
      throw new APIError(
        'Unable to create post - please try again',
        500,
        'CREATE_ERROR'
      );
    }

  } catch (error: any) {
    console.error('Create Post API Error:', error);
    return handleAPIError(error);
  }
}

