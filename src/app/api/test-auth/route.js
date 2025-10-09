import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/Lib/firebaseAdmin';

export async function GET(request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization header found',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : null
        }
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
        error: 'Invalid token',
        debug: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          errorMessage: error.message
        }
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      }
    });

  } catch (error) {
    console.error('Error in test-auth:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
