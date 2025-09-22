import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '../../Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const users = Array.isArray(body?.users) ? body.users : [];
    if (users.length === 0) return NextResponse.json({ ok: false, error: 'No users provided' }, { status: 400 });

    const groupsSnap = await adminDb.collection('groups').get();
    const results = [];

    for (const u of users) {
      const { uid, email, displayName, photoURL } = u;
      if (!uid) continue;
      // upsert user
      const ref = adminDb.collection('users').doc(uid);
      await ref.set(
        {
          id: uid,
          displayName: displayName || (email ? email.split('@')[0] : 'User'),
          username: (displayName || email || uid).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16),
          profilePictureUrl: photoURL || '',
          email: email || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // join all groups
      const batch = adminDb.batch();
      groupsSnap.forEach((doc) => batch.update(doc.ref, { members: FieldValue.arrayUnion(uid) }));
      await batch.commit();

      results.push({ uid, joinedGroups: groupsSnap.size });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


