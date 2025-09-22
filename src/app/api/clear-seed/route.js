import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';

async function deleteCollection(collectionPath, batchSize = 300) {
  const collRef = adminDb.collection(collectionPath);
  while (true) {
    const snapshot = await collRef.limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function POST() {
  try {
    // Danger: clears seeded content. Keep core collections but only seed-generated docs.
    // For simplicity, we'll clear entire seed collections and soft-clear parts of others.
    await deleteCollection('polls');
    await deleteCollection('chats');
    await deleteCollection('activities');
    await deleteCollection('posts');

    // Clear groups and users entirely only if they were created by seeder (no strong marker present).
    // Here we clear all for a clean slate.
    await deleteCollection('groups');
    await deleteCollection('users');

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


