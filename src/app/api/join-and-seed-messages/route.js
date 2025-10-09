import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';
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
    const targetGroups = Math.max(1, Math.min(50, Number(body?.groups) || 10));
    const messagesPerGroup = Math.max(1, Math.min(10, Number(body?.messagesPerGroup) || 3));

    // Pull users for alternate senders
    const usersSnap = await adminDb.collection('users').limit(100).get();
    const users = usersSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));

    const groupsSnap = await adminDb.collection('groups').limit(200).get();
    const batch = adminDb.batch();
    let joined = 0;
    const joinedGroupIds = [];

    for (const doc of groupsSnap.docs) {
      if (joined >= targetGroups) break;
      const data = doc.data() || {};
      const members = Array.isArray(data.members) ? data.members : [];
      if (!members.includes(uid)) {
        batch.update(doc.ref, { members: [...members, uid] });
        const memberRef = doc.ref.collection('members').doc(uid);
        batch.set(memberRef, { joinedAt: FieldValue.serverTimestamp() }, { merge: true });
        joined += 1;
        joinedGroupIds.push(doc.id);
      }
    }

    if (joined > 0) {
      await batch.commit();
    }

    // Seed messages in each joined group (and any existing groups if requested)
    const targetIds = joinedGroupIds.length > 0 ? joinedGroupIds : groupsSnap.docs
      .filter(d => (Array.isArray((d.data() || {}).members) ? (d.data() || {}).members.includes(uid) : false))
      .slice(0, targetGroups)
      .map(d => d.id);

    for (const gid of targetIds) {
      const messagesCol = adminDb.collection('groups').doc(gid).collection('messages');
      for (let i = 0; i < messagesPerGroup; i++) {
        const alt = users[Math.floor(Math.random() * Math.max(1, users.length))];
        const senderId = i % 2 === 0 ? uid : (alt?.id || uid);
        const senderName = senderId === uid ? (decoded.name || 'You') : (alt?.displayName || 'Member');
        await messagesCol.add({
          senderId,
          senderName,
          text: senderId === uid ? 'Hello everyone 👋' : 'Welcome to the group! 🎉',
          timestamp: FieldValue.serverTimestamp(),
          type: 'message',
        });
      }
    }

    return NextResponse.json({ ok: true, uid, joined, seededGroups: targetIds.length, messagesPerGroup });
  } catch (e) {
    console.error('join-and-seed-messages failed:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


