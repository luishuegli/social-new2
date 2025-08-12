'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function AddMeToGroupsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('Idle');
  const [updated, setUpdated] = useState<number>(0);

  const run = async () => {
    if (!user) {
      setStatus('Please sign in first.');
      return;
    }
    setStatus('Adding you to all groups...');
    try {
      const snap = await getDocs(collection(db, 'groups'));
      let count = 0;
      for (const d of snap.docs) {
        const groupRef = doc(db, 'groups', d.id);
        await updateDoc(groupRef, { members: arrayUnion(user.uid) });
        count += 1;
      }
      setUpdated(count);
      setStatus(`Done. Updated ${count} groups.`);
    } catch (e: any) {
      setStatus(`Failed: ${e?.message || String(e)}`);
    }
  };

  useEffect(() => {
    // no auto-run; require button click
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Add Me To All Groups (Dev)</h1>
      <p className="mb-4 text-sm text-gray-600">Requires you to be signed in. Uses client SDK and your auth to add your UID to each group's members array.</p>
      <button onClick={run} className="px-4 py-2 rounded bg-black text-white">Run</button>
      <div className="mt-4 text-sm">
        <div>Status: {status}</div>
        {updated > 0 && <div>Groups updated: {updated}</div>}
      </div>
    </div>
  );
}

