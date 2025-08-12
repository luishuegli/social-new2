'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../Lib/firebase';
import { arrayUnion, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AppLayout from '../../../components/AppLayout';
import { useConnections } from '../../../hooks/useConnections';

interface InvitePageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupInvitePage({ params }: InvitePageProps) {
  const { groupId } = React.use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { connections } = useConnections(user?.uid);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => connections.slice().sort((a, b) => a.other.name.localeCompare(b.other.name)), [connections]);

  const toggle = (uid: string) => {
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const sendInvites = async () => {
    if (!user) return;
    if (selected.length === 0) {
      router.replace(`/groups/${groupId}`);
      return;
    }
    setSubmitting(true);
    try {
      // Add selected users to group.members and also create requests docs
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { members: arrayUnion(...selected) });
      // Optionally, create individual membership docs
      await Promise.all(
        selected.map((uid) => setDoc(doc(db, 'groups', groupId, 'members', uid), { joinedAt: serverTimestamp() }, { merge: true }))
      );
      router.replace(`/groups/${groupId}`);
    } catch (e) {
      // Non-blocking UI; navigate anyway
      router.replace(`/groups/${groupId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto w-full">
        <div className="liquid-glass p-6">
          <h1 className="text-2xl font-bold text-content-primary mb-2">Invite friends</h1>
          <p className="text-content-secondary mb-4">Pick contacts to add to your new group.</p>

          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {sorted.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-2 rounded-card hover:bg-background-secondary cursor-pointer">
                <input type="checkbox" checked={selected.includes(c.other.id)} onChange={() => toggle(c.other.id)} />
                <span className="text-content-primary">{c.other.name || c.other.id}</span>
              </label>
            ))}
            {sorted.length === 0 && (
              <p className="text-sm text-content-secondary">No connections found.</p>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={sendInvites} disabled={submitting} className="px-4 py-2 bg-accent-primary text-content-primary rounded-card disabled:opacity-60">
              {submitting ? 'Inviting…' : 'Invite and continue'}
            </button>
            <button onClick={() => router.replace(`/groups/${groupId}`)} className="px-4 py-2 bg-content-secondary text-content-primary rounded-card">
              Skip
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

