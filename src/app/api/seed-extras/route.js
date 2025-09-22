import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '../../Lib/firebaseAdmin';

function addHours(date, h) { const d = new Date(date); d.setHours(d.getHours() + h); return d; }

export async function POST() {
  try {
    const groupsSnap = await adminDb.collection('groups').limit(8).get();
    const groups = groupsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const usersSnap = await adminDb.collection('users').limit(50).get();
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

    let scheduled = 0;
    let active = 0;
    let voting = 0;

    for (const g of groups) {
      const now = new Date();
      // Scheduled activity later today
      const schedId = `sched-${g.id.slice(0,6)}`;
      await adminDb.collection('activities').doc(schedId).set({
        id: schedId,
        title: 'Scheduled: Evening Meetup',
        description: 'Seeded scheduled activity for testing.',
        groupId: g.id,
        groupName: g.groupName || g.name || 'Group',
        date: addHours(now, 6),
        location: 'Downtown Plaza',
        participants: [],
        status: 'planned',
        creatorId: users[0]?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'group_activity'
      }, { merge: true });
      scheduled++;

      // Active activity right now
      const activeId = `active-${g.id.slice(0,6)}`;
      await adminDb.collection('activities').doc(activeId).set({
        id: activeId,
        title: 'Active: Coffee Hangout',
        description: 'Seeded active activity for testing Live Post.',
        groupId: g.id,
        groupName: g.groupName || g.name || 'Group',
        date: now,
        location: 'Cafe Central',
        participants: users.slice(0, 5).map(u => u.id),
        status: 'active',
        creatorId: users[1]?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'group_activity'
      }, { merge: true });
      active++;

      // Voting poll activity
      const pollRef = adminDb.collection('polls').doc();
      const options = [
        { id: 'opt1', text: 'Bowling', votes: 0, voters: [] },
        { id: 'opt2', text: 'Karaoke', votes: 0, voters: [] },
        { id: 'opt3', text: 'Ramen', votes: 0, voters: [] },
      ];
      await pollRef.set({
        id: pollRef.id,
        title: 'Tonight? Vote!',
        description: 'Seeded voting activity options.',
        groupId: g.id,
        groupName: g.groupName || g.name || 'Group',
        options,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        type: 'seed_poll_voting',
        totalVotes: 0,
      });
      voting++;
    }

    return NextResponse.json({ ok: true, scheduled, active, voting });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


