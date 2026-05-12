// src/app/api/messages/send/route.ts
import { NextRequest } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/apiMiddleware';
import { sendMessageSchema } from '@/lib/validation';
import { RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { trackAPIRequest } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

/**
 * POST /api/messages/send
 * Sends a message in a conversation and updates metadata
 */
async function sendMessageHandler(request: NextRequest, senderId: string) {
  const startTime = Date.now();
  const track = trackAPIRequest('/api/messages/send', 'POST', startTime);

  try {
    // Get validated body (validated by middleware)
    const body = (request as any).validatedBody || await request.json();
    const { conversationId, text } = body;

    // Get the conversation to verify sender is a participant
    const conversationRef = adminDb.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      track(404);
      return createErrorResponse(
        'Not Found',
        'Conversation not found',
        404,
        'CONVERSATION_NOT_FOUND'
      );
    }

    const conversationData = conversationDoc.data();
    const participants = conversationData?.participants || [];

    // Verify sender is a participant
    if (!participants.includes(senderId)) {
      track(403);
      return createErrorResponse(
        'Forbidden',
        'You are not a participant in this conversation',
        403,
        'NOT_PARTICIPANT'
      );
    }

    // Get the other participant ID
    const otherParticipantId = participants.find((id: string) => id !== senderId);

    // Use a transaction to atomically add message and update conversation
    const messageRef = conversationRef.collection('messages').doc();
    
    await adminDb.runTransaction(async (transaction) => {
      // Add the message to the messages subcollection
      transaction.set(messageRef, {
        senderId,
        text: text.trim(),
        timestamp: FieldValue.serverTimestamp(),
        read: false,
      });

      // Update the conversation metadata
      const updateData: any = {
        lastMessage: {
          text: text.trim(),
          senderId,
          timestamp: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Increment unread count for the other participant
      if (otherParticipantId) {
        updateData[`unreadCount.${otherParticipantId}`] = FieldValue.increment(1);
      }

      transaction.update(conversationRef, updateData);
    });

    track(200);
    return createSuccessResponse({
      message: 'Message sent successfully',
      messageId: messageRef.id
    });

  } catch (error: any) {
    logger.error('Error sending message', error, 'messages-send');
    track(500);
    return createErrorResponse(
      'Internal Server Error',
      'Failed to send message',
      500,
      'MESSAGE_SEND_ERROR',
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
    );
  }
}

// Export with middleware
export const POST = withAuth(
  sendMessageHandler,
  {
    rateLimit: RATE_LIMIT_CONFIG.api.messages.send,
    validateBody: sendMessageSchema,
  }
);


