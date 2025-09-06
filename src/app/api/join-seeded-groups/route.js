import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing Authorization Bearer token' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json().catch(() => ({}));
    const target = Math.max(1, Math.min(50, Number(body?.count) || 10));

    // Fetch up to 200 groups and add the user to the first N where they are not already a member
    const groupsSnap = await adminDb.collection('groups').limit(200).get();
    const batch = adminDb.batch();
    let joined = 0;
    for (const doc of groupsSnap.docs) {
      if (joined >= target) break;
      const data = doc.data() || {};
      const members = Array.isArray(data.members) ? data.members : [];
      if (!members.includes(uid)) {
        batch.update(doc.ref, { members: [...members, uid] });
        // optional: record join timestamp in subcollection
        const memberRef = doc.ref.collection('members').doc(uid);
        batch.set(memberRef, { joinedAt: new Date() }, { merge: true });
        joined += 1;
      }
    }

    if (joined === 0) {
      return NextResponse.json({ ok: true, message: 'User already a member of fetched groups', joined: 0 });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, uid, joined });
  } catch (e) {
    console.error('join-seeded-groups failed:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


