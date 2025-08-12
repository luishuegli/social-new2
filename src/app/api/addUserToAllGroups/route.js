// src/app/api/addUserToAllGroups/route.js
import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '../../Lib/firebaseAdmin';

// IMPORTANT: This is a development utility only. Do not ship to production as-is.

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing 'uid' query param.",
          example: '/api/addUserToAllGroups?uid=YOUR_FIREBASE_AUTH_UID',
        },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('addUserToAllGroups failed:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

