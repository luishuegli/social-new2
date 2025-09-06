'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../Lib/firebase';
import { doc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore';

export default function SettingsUsername() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<string>('');
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      const uname = (snap.exists() ? (snap.data() as any).username : '') || '';
      setCurrent(uname);
      setValue(uname);
    })();
  }, [user]);

  useEffect(() => {
    const handle = value.trim().toLowerCase();
    if (!handle || !/^[a-z0-9_\.]{3,20}$/.test(handle)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        if (handle === current.toLowerCase()) {
          setAvailable(true);
        } else {
          const snap = await getDoc(doc(db, 'usernames', handle));
          setAvailable(!snap.exists());
        }
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value, current]);

  async function changeUsername() {
    if (!user) return;
    const next = value.trim().toLowerCase();
    if (!/^[a-z0-9_\.]{3,20}$/.test(next)) { setError('Invalid username'); return; }
    setSaving(true);
    setError(null);
    try {
      await runTransaction(db, async (tx) => {
        const oldLower = (current || '').toLowerCase();
        const oldRef = oldLower ? doc(db, 'usernames', oldLower) : null;
        const newRef = doc(db, 'usernames', next);
        const newSnap = await tx.get(newRef);
        if (oldLower !== next && newSnap.exists() && (newSnap.data() as any)?.uid !== user.uid) {
          throw new Error('Username is taken');
        }
        const userRef = doc(db, 'users', user.uid);
        // reserve new (create or update if same owner)
        tx.set(newRef, { uid: user.uid, reservedAt: serverTimestamp() }, { merge: true });
        // update user (create if missing)
        tx.set(userRef, { username: next, usernameLower: next }, { merge: true });
        // release old
        if (oldRef && oldLower && oldLower !== next) {
          const oldSnap = await tx.get(oldRef);
          if (oldSnap.exists() && (oldSnap.data() as any)?.uid === user.uid) {
            tx.delete(oldRef);
          }
        }
      });
      setCurrent(value.trim());
      // Optimistically update the in-memory auth user object if present
      try {
        (user as any).username = value.trim();
      } catch {}
      setMessage('Saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to change username');
      setMessage(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="liquid-glass p-4 rounded-2xl">
      <h2 className="text-content-primary font-semibold mb-3">Username</h2>
      <div className="flex gap-2 items-center">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-background-secondary text-content-primary"
          placeholder="yourname"
        />
        <button onClick={changeUsername} disabled={saving || available === false} className="px-3 py-2 rounded-lg liquid-glass disabled:opacity-50">Save</button>
      </div>
      <div className="mt-2 text-sm">
        {checking ? 'Checking…' : available === null ? 'Enter 3–20 chars (a-z, 0-9, _ or .)' : available ? 'Available' : 'Taken'}
      </div>
      {message && <div className="mt-2 text-sm text-green-400">{message}</div>}
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
    </div>
  );
}


