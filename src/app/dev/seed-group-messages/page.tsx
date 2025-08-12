'use client';

import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../Lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const SAMPLE_TEXTS = [
  'Hey everyone! 👋',
  'Anyone up for something this weekend?',
  "Let's plan our next meetup!",
  'I found a great spot in the city.',
  'Count me in! 🙌',
];

export default function SeedGroupMessagesPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('Idle');
  const [updated, setUpdated] = useState<number>(0);

  const seedAll = async () => {
    if (!user) { setStatus('Please sign in first.'); return; }
    try {
      setStatus('Seeding messages...');
      const groupsSnap = await getDocs(query(collection(db, 'groups'), where('members', 'array-contains', user.uid)));
      let count = 0;
      for (const g of groupsSnap.docs) {
        const msgsRef = collection(db, 'groups', g.id, 'messages');
        // Add 2-3 messages
        await addDoc(msgsRef, { senderId: user.uid, text: SAMPLE_TEXTS[0], timestamp: serverTimestamp() });
        await addDoc(msgsRef, { senderId: 'bot-seed', text: SAMPLE_TEXTS[(count % (SAMPLE_TEXTS.length - 1)) + 1], timestamp: serverTimestamp() });
        count++;
      }
      setUpdated(count);
      setStatus(`Done. Seeded ${count} groups.`);
    } catch (e: any) {
      setStatus(`Failed: ${e?.message || String(e)}`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Seed Group Messages (Dev)</h1>
      <p className="mb-4 text-sm text-gray-600">Adds a couple of messages into each of your groups' chats. You must be signed in.</p>
      <button onClick={seedAll} className="px-4 py-2 rounded bg-black text-white">Seed Messages</button>
      <div className="mt-4 text-sm">
        <div>Status: {status}</div>
        {updated > 0 && <div>Groups updated: {updated}</div>}
      </div>
    </div>
  );
}

