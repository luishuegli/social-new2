import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const activityId = String(body?.activityId || '');
    const uid = String(body?.uid || '');
    if (!activityId || !uid) return NextResponse.json({ ok: false, error: 'Missing activityId or uid' }, { status: 400 });

    const ref = adminDb.collection('activities').doc(activityId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    await ref.update({
      status: 'active',
      startTime: FieldValue.serverTimestamp(),
      participants: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


