import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/Lib/firebaseAdmin';

export async function GET(request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization header',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : null,
          allHeaders: Object.fromEntries(request.headers.entries())
        }
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token',
        debug: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          errorMessage: error.message
        }
      }, { status: 401 });
    }

    const userId = decodedToken.uid;
    
    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({
      success: true,
      auth: {
        uid: userId,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      },
      firestore: {
        exists: userDoc.exists,
        data: userData
      },
      debug: {
        tokenLength: token.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in debug-user-state:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
