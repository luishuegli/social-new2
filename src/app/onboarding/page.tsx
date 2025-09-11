'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../Lib/firebase';
import { doc, runTransaction, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    // If profile already exists, skip onboarding
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) router.replace('/');
    })();
  }, [user, router]);

  async function reserveUsernameAndCreateProfile() {
    if (!user) throw new Error('Not signed in');
    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_\.]{3,20}$/.test(clean)) throw new Error('Username must be 3-20 chars (a-z, 0-9, _ or .)');

    await runTransaction(db, async (tx) => {
      const unameRef = doc(db, 'usernames', clean);
      const unameSnap = await tx.get(unameRef);
      if (unameSnap.exists()) throw new Error('Username is taken');

      const userRef = doc(db, 'users', user.uid);
      tx.set(unameRef, { uid: user.uid, reservedAt: serverTimestamp() });
      tx.set(userRef, {
        username: clean,
        usernameLower: clean,
        displayName: user.displayName || clean,
        email: user.email || '',
        createdAt: serverTimestamp(),
      });
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await reserveUsernameAndCreateProfile();
      if (password && auth.currentUser) {
        await updatePassword(auth.currentUser, password);
      }
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Debounced availability check
  useEffect(() => {
    const handle = username.trim().toLowerCase();
    if (!handle || !/^[a-z0-9_\.]{3,20}$/.test(handle)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'usernames', handle));
        setAvailable(!snap.exists());
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [username]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-content-secondary">Sign in to continue…</div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-page-padding bg-background-primary">
      <form onSubmit={handleSubmit} className="w-full max-w-md liquid-glass p-6 rounded-2xl">
        <h1 className="text-heading-2 text-content-primary font-bold mb-4">Finish setup</h1>
        <p className="text-content-secondary mb-6">Choose a unique username and set a password for email login.</p>

        <label className="block text-sm mb-2 text-content-secondary">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg bg-background-secondary text-content-primary outline-none"
          placeholder="yourname"
          required
        />
        {available !== null && (
          <div className={`-mt-3 mb-4 text-sm ${available ? 'text-green-400' : 'text-red-400'}`}>
            {checking ? 'Checking…' : available ? 'Username available' : 'Username taken'}
          </div>
        )}

        <label className="block text-sm mb-2 text-content-secondary">Password (optional)</label>
        <div className="relative mb-6">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 rounded-lg bg-background-secondary text-content-primary outline-none"
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-content-secondary hover:text-content-primary"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

        <button disabled={loading} className="w-full py-3 rounded-lg liquid-glass text-content-primary font-semibold disabled:opacity-50">
          {loading ? 'Saving…' : 'Complete setup'}
        </button>
      </form>
    </div>
  );
}


