import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';

export async function GET(request) {
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
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = decodedToken.uid;
    
    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({
      success: true,
      user: {
        uid: userId,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        firestoreData: userData
      }
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
