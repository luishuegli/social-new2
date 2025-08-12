import { NextResponse } from 'next/server';

export async function GET() {
  // Required Firestore composite indexes as specified in the blueprint
  const indexes = {
    mainFeed: {
      collection: 'posts',
      fields: [
        { fieldPath: 'authorId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    groupMessages: {
      collection: 'groups/{groupId}/messages',
      fields: [
        { fieldPath: 'timestamp', order: 'DESCENDING' }
      ]
    },
    pollsByGroup: {
      collection: 'polls',
      fields: [
        { fieldPath: 'groupId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    pollsByType: {
      collection: 'polls',
      fields: [
        { fieldPath: 'type', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    crossGroupPolls: {
      collection: 'polls',
      fields: [
        { fieldPath: 'type', order: 'ASCENDING' },
        { fieldPath: 'groupId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    userActivitySuggestions: {
      collection: 'activitySuggestions',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    voteHistoryByUser: {
      collection: 'voteHistory',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' }
      ]
    }
  };

  const indexDefinitions = Object.entries(indexes).map(([name, config]) => ({
    name: name,
    collection: config.collection,
    fields: config.fields
  }));

  return NextResponse.json({
    success: true,
    indexes: indexDefinitions,
    message: 'Required Firestore composite indexes',
    instructions: [
      '1. Go to Firebase Console → Firestore Database → Indexes',
      '2. Create composite indexes for each collection listed above',
      '3. Wait for indexes to build (may take several minutes)',
      '4. Indexes are required for complex queries to work properly'
    ],
    totalIndexes: indexDefinitions.length
  });
} 