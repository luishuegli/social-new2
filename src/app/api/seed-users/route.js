// src/app/api/seed-users/route.js
import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '../../Lib/firebaseAdmin';

// Deterministic pools for diverse dummy data
const FIRST_NAMES = [
  'Ava','Liam','Noah','Emma','Olivia','Sophia','Isabella','Mia','Charlotte','Amelia',
  'Ethan','Mason','Logan','Lucas','Jackson','Aiden','James','Benjamin','Elijah','Jacob',
  'Harper','Evelyn','Abigail','Emily','Elizabeth','Sofia','Avery','Ella','Scarlett','Grace',
  'Muhammad','Fatima','Aisha','Yusuf','Zainab','Omar','Layla','Ali','Sara','Hassan',
  'Hiro','Yuki','Sora','Akira','Mei','Kenji','Rina','Daichi','Hana','Kaito'
];
const LAST_NAMES = [
  'Johnson','Smith','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Lee','Kim','Chen','Liu','Wang','Singh','Patel','Khan','Nguyen','Tran',
  'Schneider','Müller','Kowalski','Novak','Silva','Costa','Rossi','Bianchi','Santos','Alvarez'
];

const BIOS = [
  'Explorer of new places and good coffee.','Tech enthusiast and weekend hiker.',
  'Food lover, amateur photographer.','Always up for a board game night.',
  'Fitness fan and plant parent.','Bookworm and museum hopper.',
  'Music addict, concert chaser.','Learning to cook one recipe at a time.',
  'Runner by morning, gamer by night.','Casual cyclist and picnic enjoyer.'
];

function randomFrom(array) { return array[Math.floor(Math.random() * array.length)]; }

function buildPhotoUrl(index) {
  // Use stable randomuser portraits to avoid Unsplash 404s
  const gender = index % 2 === 0 ? 'men' : 'women';
  const id = (index % 99) + 1; // 1..99 available in randomuser
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

function makeUsername(displayName, uniqueSuffix) {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) + uniqueSuffix;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = Math.max(1, Math.min(500, Number(body?.count) || 100));

    const batch = adminDb.batch();
    const usersCol = adminDb.collection('users');

    const created = [];
    for (let i = 0; i < count; i += 1) {
      const first = randomFrom(FIRST_NAMES);
      const last = randomFrom(LAST_NAMES);
      const displayName = `${first} ${last}`;
      const username = makeUsername(`${first}${last}`, String(i));
      const profilePictureUrl = buildPhotoUrl(i);
      const userDoc = usersCol.doc(); // auto-ID

      batch.set(userDoc, {
        displayName,
        username,
        bio: randomFrom(BIOS),
        profilePictureUrl,
        stats: {
          memberOfGroupCount: Math.floor(Math.random() * 8),
          activitiesPlannedCount: Math.floor(Math.random() * 15),
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      created.push({ id: userDoc.id, displayName, username });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      sample: created.slice(0, 5),
      message: `Seeded ${created.length} user profiles into Firestore (users collection).`,
    });
  } catch (error) {
    console.error('❌ Failed to seed users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Convenience GET to allow simple browser triggering (defaults)
export async function GET() {
  // Delegate to POST with default body
  const req = new Request('http://local/seed', { method: 'POST', body: JSON.stringify({ count: 100 }) });
  return POST(req);
}

