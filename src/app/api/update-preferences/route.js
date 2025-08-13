import { NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';

function normalizeKey(text = '') {
  return String(text).toLowerCase().trim().slice(0, 120);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, selectedOption, userId } = body || {};
    if (!groupId || !selectedOption || !userId) {
      return NextResponse.json({ success: false, error: 'Missing groupId, selectedOption, or userId' }, { status: 400 });
    }

    const key = normalizeKey(selectedOption);
    const docRef = adminDb.collection('ai_preferences').doc(groupId);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const now = new Date();
      if (!snap.exists) {
        tx.set(docRef, {
          groupId,
          counts: { [key]: 1 },
          updatedAt: now,
        });
      } else {
        const data = snap.data() || {};
        const counts = { ...(data.counts || {}) };
        counts[key] = (counts[key] || 0) + 1;
        tx.update(docRef, { counts, updatedAt: now });
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('update-preferences failed', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

