// src/app/api/debug-feed/route.js
import { adminDb } from '../../Lib/firebaseAdmin';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('posts')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return Response.json({ success: true, count: items.length, items });
  } catch (e) {
    console.error('debug-feed error', e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

