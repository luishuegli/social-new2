// src/app/api/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';

/**
 * POST /api/connect
 * Creates a connection request between two users with an optional message
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const currentUserId = decodedToken.uid;
    const { targetUserId, message } = await request.json();

    // Validate input
    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing targetUserId' 
      }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'You cannot connect with yourself.' 
      }, { status: 400 });
    }

    // Check if connection request already exists
    const existingConnectionQuery = await adminDb
      .collection('connections')
      .where('from', '==', currentUserId)
      .where('to', '==', targetUserId)
      .limit(1)
      .get();

    if (!existingConnectionQuery.empty) {
      const existingConnection = existingConnectionQuery.docs[0].data();
      if (existingConnection.status === 'pending') {
        return NextResponse.json({ 
          success: false, 
          error: 'Connection request already sent',
          alreadyExists: true
        }, { status: 400 });
      } else if (existingConnection.status === 'accepted') {
        return NextResponse.json({ 
          success: false, 
          error: 'You are already connected with this user',
          alreadyConnected: true
        }, { status: 400 });
      }
    }

    // Check if there's a reverse connection (they sent you a request)
    const reverseConnectionQuery = await adminDb
      .collection('connections')
      .where('from', '==', targetUserId)
      .where('to', '==', currentUserId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    // If reverse connection exists, automatically accept it (mutual match!)
    if (!reverseConnectionQuery.empty) {
      const batch = adminDb.batch();
      const reverseConnectionDoc = reverseConnectionQuery.docs[0];
      
      // Update the existing connection to accepted
      batch.update(reverseConnectionDoc.ref, {
        status: 'accepted',
        acceptedAt: FieldValue.serverTimestamp(),
      });

      // Create the reverse connection (bidirectional)
      const newConnectionRef = adminDb.collection('connections').doc();
      batch.set(newConnectionRef, {
        from: currentUserId,
        to: targetUserId,
        status: 'accepted',
        message: message || null,
        createdAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp(),
      });

      // Update both users' connections arrays
      const currentUserRef = adminDb.collection('users').doc(currentUserId);
      const targetUserRef = adminDb.collection('users').doc(targetUserId);

      batch.update(currentUserRef, {
        connections: FieldValue.arrayUnion(targetUserId),
        pendingRequests: FieldValue.arrayRemove(targetUserId),
      });

      batch.update(targetUserRef, {
        connections: FieldValue.arrayUnion(currentUserId),
        pendingRequests: FieldValue.arrayRemove(currentUserId),
      });

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Connection automatically accepted (mutual match)!',
        connectionId: newConnectionRef.id,
        mutualMatch: true
      }, { status: 200 });
    }

    // Create a new connection request
    const batch = adminDb.batch();
    const connectionRef = adminDb.collection('connections').doc();
    
    batch.set(connectionRef, {
      from: currentUserId,
      to: targetUserId,
      status: 'pending',
      message: message || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add to target user's pending requests
    const targetUserRef = adminDb.collection('users').doc(targetUserId);
    batch.update(targetUserRef, {
      pendingRequests: FieldValue.arrayUnion(currentUserId),
    });

    // Update current user's compass activity
    const currentUserRef = adminDb.collection('users').doc(currentUserId);
    batch.update(currentUserRef, {
      'compass.lastActiveTimestamp': FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Connection request sent successfully',
      connectionId: connectionRef.id 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/connect:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/connect?targetUserId=xxx
 * Check connection status with a specific user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const currentUserId = decodedToken.uid;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing targetUserId parameter' 
      }, { status: 400 });
    }

    // Check for existing connection
    const connectionQuery = await adminDb
      .collection('connections')
      .where('from', '==', currentUserId)
      .where('to', '==', targetUserId)
      .limit(1)
      .get();

    if (!connectionQuery.empty) {
      const connectionData = connectionQuery.docs[0].data();
      return NextResponse.json({
        success: true,
        isConnected: connectionData.status === 'accepted',
        isPending: connectionData.status === 'pending',
        status: connectionData.status,
      });
    }

    // Check for reverse connection
    const reverseConnectionQuery = await adminDb
      .collection('connections')
      .where('from', '==', targetUserId)
      .where('to', '==', currentUserId)
      .limit(1)
      .get();

    if (!reverseConnectionQuery.empty) {
      const connectionData = reverseConnectionQuery.docs[0].data();
      return NextResponse.json({
        success: true,
        isConnected: connectionData.status === 'accepted',
        isPending: connectionData.status === 'pending',
        status: connectionData.status,
        receivedRequest: true,
      });
    }

    return NextResponse.json({
      success: true,
      isConnected: false,
      isPending: false,
      status: 'none',
    });

  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

