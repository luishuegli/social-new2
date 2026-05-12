// src/app/api/connections/respond/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/app/Lib/firebaseAdmin';

/**
 * POST /api/connections/respond
 * Handles accepting or declining connection requests
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
    const { connectionId, action } = await request.json();

    // Validate input
    if (!connectionId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing connectionId or action' 
      }, { status: 400 });
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action must be "accept" or "decline"' 
      }, { status: 400 });
    }

    // Get the connection document
    const connectionRef = adminDb.collection('connections').doc(connectionId);
    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Connection request not found' 
      }, { status: 404 });
    }

    const connectionData = connectionDoc.data();
    
    // Verify that the current user is the recipient
    if (connectionData?.to !== currentUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'You are not the recipient of this connection request' 
      }, { status: 403 });
    }

    // Check if already processed
    if (connectionData?.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: `Connection request already ${connectionData?.status}`,
        alreadyProcessed: true
      }, { status: 400 });
    }

    const batch = adminDb.batch();

    if (action === 'accept') {
      // Update connection status to accepted
      batch.update(connectionRef, {
        status: 'accepted',
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update both users' connections arrays
      const requesterRef = adminDb.collection('users').doc(connectionData.from);
      const recipientRef = adminDb.collection('users').doc(connectionData.to);

      batch.update(requesterRef, {
        connections: FieldValue.arrayUnion(connectionData.to),
        pendingRequests: FieldValue.arrayRemove(connectionData.to),
      });

      batch.update(recipientRef, {
        connections: FieldValue.arrayUnion(connectionData.from),
        pendingRequests: FieldValue.arrayRemove(connectionData.from),
      });

      // Create a conversation
      const conversationRef = adminDb.collection('conversations').doc();
      
      // Fetch user info for the conversation
      const [requesterDoc, recipientDoc] = await Promise.all([
        adminDb.collection('users').doc(connectionData.from).get(),
        adminDb.collection('users').doc(connectionData.to).get(),
      ]);

      const requesterData = requesterDoc.data();
      const recipientData = recipientDoc.data();

      batch.set(conversationRef, {
        participants: [connectionData.from, connectionData.to],
        participantInfo: {
          [connectionData.from]: {
            username: requesterData?.username || requesterData?.displayName || 'User',
            photoURL: requesterData?.photoURL || null,
          },
          [connectionData.to]: {
            username: recipientData?.username || recipientData?.displayName || 'User',
            photoURL: recipientData?.photoURL || null,
          },
        },
        lastMessage: connectionData.message ? {
          text: connectionData.message,
          senderId: connectionData.from,
          timestamp: FieldValue.serverTimestamp(),
        } : null,
        unreadCount: {
          [connectionData.from]: 0,
          [connectionData.to]: connectionData.message ? 1 : 0,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // If there was an initial message, add it to messages subcollection
      if (connectionData.message) {
        const firstMessageRef = conversationRef.collection('messages').doc();
        batch.set(firstMessageRef, {
          senderId: connectionData.from,
          text: connectionData.message,
          timestamp: FieldValue.serverTimestamp(),
          read: false,
        });
      }

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Connection request accepted',
        conversationId: conversationRef.id,
        action: 'accepted'
      }, { status: 200 });

    } else {
      // Decline the connection
      batch.update(connectionRef, {
        status: 'declined',
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Remove from recipient's pending requests
      const recipientRef = adminDb.collection('users').doc(connectionData.to);
      batch.update(recipientRef, {
        pendingRequests: FieldValue.arrayRemove(connectionData.from),
      });

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Connection request declined',
        action: 'declined'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error in /api/connections/respond:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

