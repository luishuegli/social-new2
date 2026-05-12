/**
 * Shared data mapping utilities to prevent code duplication
 * across pagination hooks and services
 */

import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Maps a Firestore group document to a standardized Group object
 * Used by usePaginatedGroups hook to maintain consistency
 */
export const mapGroupDocument = (doc: QueryDocumentSnapshot<DocumentData>, userId?: string) => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || 'Group',
    description: data.description || '',
    coverImage: data.coverImage || '',
    memberCount: data.members?.length || 0,
    nextActivity: data.nextActivity || null,
    isJoined: userId ? (data.members?.includes(userId) || false) : false,
    tags: data.tags || [],
    createdAt: data.createdAt
  };
};

/**
 * Maps a Firestore post document to a standardized Post object
 */
export const mapPostDocument = (doc: QueryDocumentSnapshot<DocumentData>) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    timestamp: data.timestamp?.toDate?.() || data.timestamp,
    createdAt: data.createdAt?.toDate?.() || data.createdAt
  };
};

/**
 * Maps a Firestore activity document to a standardized Activity object
 */
export const mapActivityDocument = (doc: QueryDocumentSnapshot<DocumentData>) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate?.() || data.date
  };
};







