// src/app/api/seed-min/route.js
import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '../../Lib/firebaseAdmin';

function rand(n) { return Math.floor(Math.random() * n); }

export async function GET() {
  try {
    const postsCol = adminDb.collection('posts');
    const usersCol = adminDb.collection('users');
    const groupsCol = adminDb.collection('groups');

    const [usersSnap, groupsSnap] = await Promise.all([
      usersCol.limit(50).get(),
      groupsCol.limit(10).get(),
    ]);

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'No users found. Run /api/seed-users first or create a user.' }, { status: 400 });
    }

    const batch = adminDb.batch();

    // 3 collaborative posts
    for (let i = 0; i < 3; i++) {
      const author = users[rand(users.length)];
      const group = groups.length ? groups[rand(groups.length)] : null;
      const ref = postsCol.doc();
      const participants = Array.from({ length: 3 + rand(3) }).map(() => {
        const u = users[rand(users.length)];
        return { name: u.displayName, avatarUrl: u.profilePictureUrl };
      });
      batch.set(ref, {
        activityTitle: `Group Activity #${i + 1}`,
        authorId: author.id,
        authorName: author.displayName,
        authorAvatar: author.profilePictureUrl,
        groupId: group?.id || null,
        groupName: group?.groupName || 'Community',
        authenticityType: rand(2) ? 'Live Post' : 'Later Post',
        postType: 'Collaborative',
        description: 'Seeded collaborative post for quick verification.',
        media: [],
        timestamp: FieldValue.serverTimestamp(),
        participants,
      });
    }

    // 4 individual posts with images
    const imgs = [
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526404079161-1e1620a2f827?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop',
    ];
    for (let i = 0; i < 4; i++) {
      const author = users[rand(users.length)];
      const ref = postsCol.doc();
      const imageUrl = imgs[i % imgs.length];
      batch.set(ref, {
        activityTitle: `Solo Update #${i + 1}`,
        authorId: author.id,
        authorName: author.displayName,
        authorAvatar: author.profilePictureUrl,
        authenticityType: rand(2) ? 'Live Post' : 'Later Post',
        postType: 'Individual',
        description: 'Seeded individual post for quick verification.',
        imageUrl,
        media: [{ url: imageUrl, type: 'image' }],
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, created: 7 });
  } catch (e) {
    console.error('❌ seed-min failed:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

