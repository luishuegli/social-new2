import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/app/Lib/firebaseAdmin';

// POST: Create a new solo activity
export async function POST(request) {
  try {
    const { userId, title, date, time, description } = await request.json();

    if (!userId || !title || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dateTime = new Date(`${date}T${time || '00:00:00'}`);

    const newActivity = {
      userId,
      title,
      date: dateTime,
      description: description || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('soloActivities').add(newActivity);

    return NextResponse.json({ id: docRef.id, ...newActivity }, { status: 201 });

  } catch (error) {
    console.error('Error creating solo activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Fetch solo activities for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const snapshot = await adminDb.collection('soloActivities').where('userId', '==', userId).get();
    
    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(activities, { status: 200 });

  } catch (error) {
    console.error('Error fetching solo activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
