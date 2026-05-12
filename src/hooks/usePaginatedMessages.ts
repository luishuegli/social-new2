import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../app/Lib/firebase';
import { usePaginationState, useIntersectionObserver, PAGINATION_CONFIG } from '../lib/pagination';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  text: string;
  timestamp: any;
  read: boolean;
  conversationId: string;
  type?: 'text' | 'image' | 'system';
  imageUrl?: string;
}

export interface UsePaginatedMessagesOptions {
  conversationId?: string;
  groupId?: string;
  enableInfiniteScroll?: boolean;
}

export function usePaginatedMessages(options: UsePaginatedMessagesOptions = {}) {
  const { conversationId, groupId, enableInfiniteScroll = true } = options;
  
  const {
    state,
    setItems,
    appendItems,
    prependItems,
    setLoading,
    setHasMore,
    setLastDoc,
    setError,
    reset,
  } = usePaginationState<Message>();

  const config = PAGINATION_CONFIG.messages;

  // Build the Firestore query
  const buildQuery = useCallback((startAfterDoc?: QueryDocumentSnapshot) => {
    let q: any;

    if (conversationId) {
      // Messages in a conversation
      q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc') // Newest first for chat
      );
    } else if (groupId) {
      // Messages in a group
      q = query(
        collection(db, 'messages'),
        where('groupId', '==', groupId),
        orderBy('timestamp', 'desc')
      );
    } else {
      throw new Error('Either conversationId or groupId must be provided');
    }

    // Add pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    return q;
  }, [conversationId, groupId]);

  // Load initial messages
  const loadInitial = useCallback(async () => {
    if (state.loading || (!conversationId && !groupId)) return;
    
    setLoading(true);
    setError(null);

    try {
      const q = query(buildQuery(), limit(config.initialLoad));
      const snapshot = await getDocs(q);
      
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      })) as Message[];

      // Reverse messages for chat (oldest first)
      const orderedMessages = messages.reverse();

      setItems(orderedMessages);
      setLastDoc((snapshot.docs[snapshot.docs.length - 1] as any) || null);
      setHasMore(snapshot.docs.length === config.initialLoad);
    } catch (error) {
      console.error('Error loading initial messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.initialLoad, state.loading, conversationId, groupId]);

  // Load more messages (for scrolling up in chat)
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !state.lastDoc) return;

    setLoading(true);

    try {
      const q = query(
        buildQuery(state.lastDoc),
        limit(config.batchSize)
      );
      
      const snapshot = await getDocs(q);
      
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      })) as Message[];

      // Reverse and prepend to existing messages
      const orderedNewMessages = newMessages.reverse();
      prependItems(orderedNewMessages);
      
      setLastDoc((snapshot.docs[snapshot.docs.length - 1] as any) || null);
      setHasMore(snapshot.docs.length === config.batchSize);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError('Failed to load more messages');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.batchSize, state.loading, state.hasMore, state.lastDoc]);

  // Refresh messages (reload from beginning)
  const refresh = useCallback(async () => {
    reset();
    await loadInitial();
  }, [reset, loadInitial]);

  // Set up infinite scroll for loading older messages
  const triggerRef = useIntersectionObserver(
    loadMore,
    state.hasMore,
    state.loading
  );

  // Load initial data on mount or when dependencies change
  useEffect(() => {
    if (conversationId || groupId) {
      loadInitial();
    }
  }, [conversationId, groupId]); // Reload when conversation/group changes

  return {
    messages: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    triggerRef: enableInfiniteScroll ? triggerRef : null,
  };
}
