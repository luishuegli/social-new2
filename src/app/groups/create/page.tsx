'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../Lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to create a group.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const groupsRef = collection(db, 'groups');
      const docRef = await addDoc(groupsRef, {
        groupName: name.trim(),
        description: description.trim(),
        category: category || 'General',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [user.uid],
        isPinned: false,
        profilePictureUrl: '',
        latestActivity: {
          type: 'message',
          content: 'Group created',
          author: {
            name: user.displayName || 'You',
            avatarUrl: user.profilePictureUrl || user.photoURL || '',
          },
          timestamp: serverTimestamp(),
        },
      });

      // Upload profile image if provided
      if (imageFile) {
        const path = `groups/${docRef.id}/profile-${Date.now()}-${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, 'groups', docRef.id), { profilePictureUrl: url });
      }

      // Optional: record membership document for join metadata
      await setDoc(doc(db, 'groups', docRef.id, 'members', user.uid), {
        joinedAt: serverTimestamp(),
      }).catch(() => {});

      // After creating, go to invite flow
      router.replace(`/groups/${docRef.id}/invite`);
    } catch (err) {
      setError((err as Error).message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto w-full">
        <div className="liquid-glass p-6">
          <h1 className="text-2xl font-bold text-content-primary mb-4">Create a new group</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-content-secondary mb-1">Group profile photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-content-secondary file:mr-4 file:py-2 file:px-3 file:rounded-card file:border file:border-white/10 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-content-secondary mb-1">Group name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-card px-3 py-2 bg-background-primary border border-border-separator text-content-primary"
                placeholder="City Explorers"
              />
            </div>
            <div>
              <label className="block text-sm text-content-secondary mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-card px-3 py-2 bg-background-primary border border-border-separator text-content-primary min-h-28"
                placeholder="What is this group about?"
              />
            </div>
            <div>
              <label className="block text-sm text-content-secondary mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-card px-3 py-2 bg-background-primary border border-border-separator text-content-primary"
              >
                <option>General</option>
                <option>Outdoors</option>
                <option>Sports</option>
                <option>Food</option>
                <option>Travel</option>
                <option>Hobbies</option>
              </select>
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-white/10 text-white rounded-card hover:bg-white/20 backdrop-blur-sm disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create group'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-white/10 text-white rounded-card hover:bg-white/20 backdrop-blur-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

