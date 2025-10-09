import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { action, uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    if (action === 'join-all-groups') {
      const groupsSnap = await adminDb.collection('groups').get();
      let updated = 0;

      const batch = adminDb.batch();
      groupsSnap.forEach((doc) => {
        const ref = adminDb.collection('groups').doc(doc.id);
        batch.update(ref, { members: FieldValue.arrayUnion(uid) });
        updated += 1;
      });
      await batch.commit();

      return NextResponse.json({ ok: true, uid, updatedGroups: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('dev-utils failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
