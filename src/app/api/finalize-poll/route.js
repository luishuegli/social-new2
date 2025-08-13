// src/app/api/finalize-poll/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '../../Lib/firebaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pollId } = body || {};
    if (!pollId) return NextResponse.json({ success: false, error: 'pollId required' }, { status: 400 });

    const pollRef = adminDb.collection('polls').doc(pollId);
    const snap = await pollRef.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    const poll = snap.data();

    const options = Array.isArray(poll.options) ? poll.options : [];
    if (options.length === 0) return NextResponse.json({ success: false, error: 'No options to finalize' }, { status: 400 });
    const winner = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

    await pollRef.update({ status: 'closed' });

    const payload = {
      title: winner.title || poll.title || 'Activity',
      description: winner.description || poll.description || '',
      groupId: poll.groupId || '',
      activityDate: winner?.details?.date || null,
      location: winner?.details?.location || '',
      pollId: pollId,
      participants: poll.createdBy ? [poll.createdBy] : [],
      status: 'planned',
      creatorId: poll.createdBy || '',
      createdAt: new Date(),
    };
    const actRef = await adminDb.collection('activities').add(payload);

    return NextResponse.json({ success: true, activityId: actRef.id });
  } catch (e) {
    console.error('finalize-poll failed', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

