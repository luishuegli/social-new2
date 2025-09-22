'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../Lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type DMPreference = 'everyone' | 'followers' | 'noone';
type MentionPreference = 'everyone' | 'followers';
type ConnectionsVisibility = 'everyone' | 'followers' | 'only_me';
type ProfileVisibility = 'public' | 'followers' | 'private';

export default function SettingsPrivacy() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [defaultPostVisibility, setDefaultPostVisibility] = useState<ProfileVisibility>('public');
  const [dmPref, setDmPref] = useState<DMPreference>('everyone');
  const [mentionPref, setMentionPref] = useState<MentionPreference>('everyone');
  const [connectionsVisibility, setConnectionsVisibility] = useState<ConnectionsVisibility>('everyone');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      const d: any = snap.data() || {};
      setDefaultPostVisibility(d.privacy?.defaultPostVisibility || 'public');
      setDmPref(d.privacy?.dm || 'everyone');
      setMentionPref(d.privacy?.mentions || 'everyone');
      setConnectionsVisibility(d.privacy?.connectionsVisibility || 'everyone');
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setMessage(null);
    await setDoc(
      doc(db, 'users', user.uid),
      {
        privacy: {
          defaultPostVisibility,
          dm: dmPref,
          mentions: mentionPref,
          connectionsVisibility,
        },
      },
      { merge: true }
    );
    setMessage('Saved');
  }

  if (!user) return null;

  return (
    <div className="liquid-glass p-4 rounded-2xl space-y-4">
      <h2 className="text-content-primary font-semibold">Privacy</h2>

      <div>
        <label className="block text-content-secondary mb-1">Default post visibility</label>
        <select value={defaultPostVisibility} onChange={(e) => setDefaultPostVisibility(e.target.value as ProfileVisibility)} className="w-full px-3 py-2 rounded-input bg-background-secondary text-content-primary">
          <option value="public">Public</option>
          <option value="followers">Followers</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div>
        <label className="block text-content-secondary mb-1">Followers & Following visibility</label>
        <select value={connectionsVisibility} onChange={(e) => setConnectionsVisibility(e.target.value as ConnectionsVisibility)} className="w-full px-3 py-2 rounded-input bg-background-secondary text-content-primary">
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
          <option value="only_me">Only me</option>
        </select>
        <p className="text-caption text-content-tertiary mt-1">Control who can view your followers/following lists.</p>
      </div>

      <div>
        <label className="block text-content-secondary mb-1">Who can DM you</label>
        <select value={dmPref} onChange={(e) => setDmPref(e.target.value as DMPreference)} className="w-full px-3 py-2 rounded-input bg-background-secondary text-content-primary">
          <option value="everyone">Everyone</option>
          <option value="followers">Followers</option>
          <option value="noone">No one</option>
        </select>
      </div>

      <div>
        <label className="block text-content-secondary mb-1">Who can mention you</label>
        <select value={mentionPref} onChange={(e) => setMentionPref(e.target.value as MentionPreference)} className="w-full px-3 py-2 rounded-input bg-background-secondary text-content-primary">
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-card font-semibold bg-accent-primary text-content-primary hover:bg-opacity-80">Save</button>
        {message && <span className="text-green-400 text-sm">{message}</span>}
      </div>
    </div>
  );
}


