import { NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';

function normalizeKey(text = '') {
  return String(text).toLowerCase().trim().slice(0, 120);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, selectedOption, userId, key: explicitKey, delta, placeId, name } = body || {};
    if (!groupId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing groupId or userId' }, { status: 400 });
    }

    const key = normalizeKey(explicitKey || selectedOption || name);
    if (!key) {
      return NextResponse.json({ success: false, error: 'Missing feedback key/name' }, { status: 400 });
    }

    const deltaNum = Math.max(-3, Math.min(3, Number(delta ?? 1)));
    const docRef = adminDb.collection('ai_preferences').doc(groupId);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const now = new Date();
      if (!snap.exists) {
        tx.set(docRef, {
          groupId,
          counts: { [key]: deltaNum },
          updatedAt: now,
        });
      } else {
        const data = snap.data() || {};
        const counts = { ...(data.counts || {}) };
        counts[key] = (counts[key] || 0) + deltaNum;
        tx.update(docRef, { counts, updatedAt: now });
      }
    });

    // Store raw feedback audit (non-critical)
    try {
      await adminDb.collection('ai_feedback').add({
        groupId,
        userId,
        key,
        delta: deltaNum,
        placeId: placeId || null,
        name: name || selectedOption || null,
        createdAt: new Date(),
      });
    } catch (_) {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('update-preferences failed', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

