// src/app/api/compass/log-swipe/route.ts
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth } from '@/app/Lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const { targetId, action } = await req.json();
    
    // Validate parameters
    if (!targetId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action !== 'connect' && action !== 'skip') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (userId === targetId) {
      return NextResponse.json({ error: 'Cannot swipe on yourself' }, { status: 400 });
    }

    // Create batch for atomic operations
    const batch = adminDb.batch();

    // 1. Write to the swipe log (immutable ledger)
    const swipeLogRef = adminDb.collection('swipe_log').doc();
    batch.set(swipeLogRef, {
      swiperId: userId,
      targetId: targetId,
      action: action,
      timestamp: FieldValue.serverTimestamp(),
    });

    // 2. Update the user's seen list to prevent re-showing
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, {
      [`compass.seenProfileIds.${targetId}`]: FieldValue.serverTimestamp(),
      'compass.lastActiveTimestamp': FieldValue.serverTimestamp(),
    });

    // 3. If it's a connect action, handle connection tokens
    if (action === 'connect') {
      // Decrement connection tokens
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      if (userData?.compass?.connectionTokens?.count > 0) {
        batch.update(userRef, {
          'compass.connectionTokens.count': FieldValue.increment(-1),
        });
      } else {
        // User has no tokens left
        return NextResponse.json({ 
          error: 'No connection tokens available',
          requiresTokens: true 
        }, { status: 403 });
      }

      // Optional: Create a pending connection request (if you have this system)
      // This would integrate with your existing connection system
      const targetRef = adminDb.collection('users').doc(targetId);
      batch.update(targetRef, {
        'pendingRequests': FieldValue.arrayUnion(userId),
      });
    }

    // Commit the batch
    await batch.commit();

    // Return success with updated token count if applicable
    if (action === 'connect') {
      const updatedUser = await userRef.get();
      const updatedData = updatedUser.data();
      return NextResponse.json({ 
        success: true,
        remainingTokens: updatedData?.compass?.connectionTokens?.count || 0
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in log-swipe:', error);
    
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
