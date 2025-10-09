import { NextResponse } from 'next/server';
import { adminDb } from '@/app/Lib/firebaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 });
    }

    const groupsSnap = await adminDb
      .collection('groups')
      .where('members', 'array-contains', uid)
      // avoid composite index requirement by skipping orderBy here
      .limit(50)
      .get();

    const groups = await Promise.all(groupsSnap.docs.map(async (d) => {
      const data = d.data();
      const na = data.nextActivity || null;
      const la = data.latestActivity || null;
      const nextActivity = na
        ? {
            ...na,
            date: (na.date && typeof na.date.toDate === 'function') ? na.date.toDate() : (na.date instanceof Date ? na.date : null),
          }
        : null;
      const latestActivity = la
        ? {
            ...la,
            timestamp: (la.timestamp && typeof la.timestamp.toDate === 'function') ? la.timestamp.toDate() : (la.timestamp instanceof Date ? la.timestamp : null),
          }
        : null;

      // Build a small preview list of member profiles for UI (up to 6)
      const memberIds = Array.isArray(data.members) ? data.members.slice(0, 6) : [];
      const members = [];
      for (const uid of memberIds) {
        try {
          const u = await adminDb.collection('users').doc(uid).get();
          if (u.exists) {
            const ud = u.data() || {};
            members.push({ id: u.id, name: ud.displayName || 'User', avatarUrl: ud.profilePictureUrl || '' });
          } else {
            members.push({ id: uid, name: 'User', avatarUrl: '' });
          }
        } catch {
          members.push({ id: uid, name: 'User', avatarUrl: '' });
        }
      }

      return {
        id: d.id,
        name: (data.groupName || 'Unknown Group').replace(/\s+\d+$/, ''),
        description: data.description || 'No description available',
        memberCount: Array.isArray(data.members) ? data.members.length : 0,
        members,
        isMember: true,
        nextActivity,
        latestActivity,
        category: data.category || 'General',
        coverImage: data.profilePictureUrl || '',
        isPinned: !!data.isPinned,
      };
    }));

    return NextResponse.json({ ok: true, groups });
  } catch (e) {
    console.error('my-groups failed:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


