'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../Lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const SAMPLE_MSGS = [
  'Hey! Great to connect here 👋',
  'Shall we plan something this week?',
  'Sounds good to me!'
];

export default function SeedChatsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('Idle');
  const [created, setCreated] = useState<number>(0);

  const seed = async () => {
    if (!user) { setStatus('Please sign in first.'); return; }
    try {
      setStatus('Seeding chats...');

      // Pick a few other users to chat with
      const usersSnap = await getDocs(collection(db, 'users'));
      const otherUsers = usersSnap.docs
        .map(d => ({ id: d.id }))
        .filter(u => u.id !== user.uid)
        .slice(0, 3);

      // Existing chats with me
      const myChatsSnap = await getDocs(query(collection(db, 'chats'), where('members', 'array-contains', user.uid)));
      const existingPairs = new Set(
        myChatsSnap.docs.map(d => JSON.stringify((d.data() as any).members?.sort()))
      );

      let made = 0;
      for (const other of otherUsers) {
        const pairKey = JSON.stringify([other.id, user.uid].sort());
        if (existingPairs.has(pairKey)) continue;

        // Create chat doc
        const chatRef = await addDoc(collection(db, 'chats'), {
          members: [user.uid, other.id],
          createdAt: serverTimestamp()
        });

        // Seed a couple of messages
        const msgsRef = collection(db, 'chats', chatRef.id, 'messages');
        await addDoc(msgsRef, { senderId: user.uid, text: SAMPLE_MSGS[0], timestamp: serverTimestamp() });
        await addDoc(msgsRef, { senderId: other.id, text: SAMPLE_MSGS[1], timestamp: serverTimestamp() });
        await addDoc(msgsRef, { senderId: user.uid, text: SAMPLE_MSGS[2], timestamp: serverTimestamp() });

        made += 1;
      }

      setCreated(made);
      setStatus(`Done. Created ${made} new chats.`);
    } catch (e: any) {
      setStatus(`Failed: ${e?.message || String(e)}`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Seed Direct Chats (Dev)</h1>
      <p className="mb-4 text-sm text-gray-600">Creates a few 1:1 chats with other users and seeds a couple of messages. Requires you to be signed in.</p>
      <button className="px-4 py-2 rounded bg-black text-white" onClick={seed}>Seed Chats</button>
      <div className="mt-4 text-sm">
        <div>Status: {status}</div>
        {created > 0 && <div>Chats created: {created}</div>}
      </div>
    </div>
  );
}

