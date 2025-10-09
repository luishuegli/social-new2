import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

// Replace incorrect membership identifiers (e.g., email) with the real Firebase UID
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing Authorization Bearer token' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email || '';

    const body = await request.json().catch(() => ({}));
    const legacyId = String(body?.legacyId || email).trim();
    if (!legacyId) {
      return NextResponse.json({ ok: false, error: 'No legacy identifier provided' }, { status: 400 });
    }

    // Find groups listing the legacy identifier in members
    const snap = await adminDb
      .collection('groups')
      .where('members', 'array-contains', legacyId)
      .limit(500)
      .get();

    let updated = 0;
    for (const doc of snap.docs) {
      // Remove legacy id and add uid
      await doc.ref.update({ members: FieldValue.arrayRemove(legacyId) });
      await doc.ref.update({ members: FieldValue.arrayUnion(uid) });
      // Ensure subcollection membership doc
      await doc.ref.collection('members').doc(uid).set({ joinedAt: new Date() }, { merge: true });
      updated += 1;
    }

    return NextResponse.json({ ok: true, uid, legacyId, fixedGroups: updated });
  } catch (e) {
    console.error('fix-membership-ids failed:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


