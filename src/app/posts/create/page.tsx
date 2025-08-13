'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/app/components/AppLayout';
import { useAuth } from '@/app/contexts/AuthContext';
import { db, storage } from '@/app/Lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from 'next/navigation';

type ActivityFormState = {
  title: string;
  category: string;
  date: string; // yyyy-mm-dd
  description: string;
};

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'activity' | 'choice' | 'live' | 'later'>('activity');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityFormState>({
    title: '',
    category: '',
    date: '',
    description: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const canContinueFromActivity = useMemo(() => {
    return (
      activity.title.trim().length > 0 &&
      activity.category.trim().length > 0 &&
      activity.date.trim().length > 0 &&
      activity.description.trim().length > 0
    );
  }, [activity]);

  const handleCreateLaterPost = async () => {
    if (!user) {
      setError('You need to be logged in to create a post.');
      return;
    }
    if (!canContinueFromActivity) {
      setError('Please complete the activity details first.');
      setStep('activity');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let uploadedUrl: string | undefined = undefined;
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectRef = ref(
          storage,
          `posts/${user.uid}/${Date.now()}_${safeName}`
        );
        const uploadResult = await uploadBytes(objectRef, imageFile);
        uploadedUrl = await getDownloadURL(uploadResult.ref);
      }

      const postDoc: {
        authorId: string;
        authorName: string;
        authorAvatar: string;
        activityTitle: string;
        activityCategory: string;
        activityDate: string;
        activityDescription: string;
        description: string;
        imageUrl?: string;
        media: Array<{ url: string; type: 'image' }>;
        authenticityType: 'Later Post';
        timestamp: ReturnType<typeof serverTimestamp>;
        createdAt: ReturnType<typeof serverTimestamp>;
        likes: number;
        comments: number;
      } = {
        // Author
        authorId: user.uid,
        authorName: user.displayName || user.email || 'User',
        authorAvatar: user.photoURL || '',

        // Activity Gate
        activityTitle: activity.title,
        activityCategory: activity.category,
        activityDate: activity.date, // store as string for now; can migrate to Timestamp later
        activityDescription: activity.description,

        // Post content
        description: caption,
        imageUrl: uploadedUrl,
        media: uploadedUrl ? [{ url: uploadedUrl, type: 'image' }] : [],

        // Authenticity
        authenticityType: 'Later Post' as const,
        postType: 'Individual' as const,

        // Meta
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
      };

      await addDoc(collection(db, 'posts'), postDoc);

      // Navigate to home feed after successful creation
      router.push('/home');
    } catch (e) {
      console.error('Failed to create post:', e);
      const message = e instanceof Error ? e.message : 'Failed to create post.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto w-full">
        <div className="liquid-glass p-4 sm:p-6 lg:p-8 mb-6">
          <h1 className="text-heading-1 font-bold text-content-primary">Create Post</h1>
          <p className="text-content-secondary mt-2">Every post starts with a real activity.</p>
        </div>

        {/* Activity Gate */}
        {step === 'activity' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
              <label className="block text-content-secondary mb-1">Activity Title</label>
              <input
                type="text"
                value={activity.title}
                onChange={(e) => setActivity((s) => ({ ...s, title: e.target.value }))}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary placeholder-content-secondary focus:border-accent-primary focus:outline-none"
                placeholder="e.g., Saturday Morning Hike"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1">Category</label>
              <select
                value={activity.category}
                onChange={(e) => setActivity((s) => ({ ...s, category: e.target.value }))}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="Outdoors">Outdoors</option>
                <option value="Food">Food</option>
                <option value="Fitness">Fitness</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Study">Study</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-content-secondary mb-1">Date</label>
              <input
                type="date"
                value={activity.date}
                onChange={(e) => setActivity((s) => ({ ...s, date: e.target.value }))}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary focus:border-accent-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1">Description</label>
              <textarea
                value={activity.description}
                onChange={(e) => setActivity((s) => ({ ...s, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary placeholder-content-secondary focus:border-accent-primary focus:outline-none"
                placeholder="Briefly describe the activity (who, where, why)"
              />
            </div>

            <div className="flex justify-end">
              <button
                disabled={!canContinueFromActivity}
                onClick={() => setStep('choice')}
                className={`px-4 py-2 rounded-card font-semibold transition-colors ${
                  canContinueFromActivity
                    ? 'bg-accent-primary text-content-primary hover:bg-opacity-80'
                    : 'bg-background-secondary text-content-tertiary cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Authenticity Choice */}
        {step === 'choice' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Choose how to create</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setStep('live')}
                className="w-full px-4 py-6 rounded-card border border-border-separator text-left hover:bg-background-secondary transition-colors"
              >
                <div className="font-semibold text-content-primary">Create a Live Post</div>
                <div className="text-content-secondary mt-1">Use camera for real-time capture</div>
              </button>
              <button
                onClick={() => setStep('later')}
                className="w-full px-4 py-6 rounded-card border border-border-separator text-left hover:bg-background-secondary transition-colors"
              >
                <div className="font-semibold text-content-primary">Create a Later Post</div>
                <div className="text-content-secondary mt-1">Upload from your device</div>
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('activity')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Live placeholder */}
        {step === 'live' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Live Post</h2>
            <p className="text-content-secondary">
              Live Post creation (camera access) will be implemented here.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setStep('choice')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Later Post form */}
        {step === 'later' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Later Post</h2>

            <div>
              <label className="block text-content-secondary mb-1">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-content-primary"
              />
            </div>

            <div>
              <label className="block text-content-secondary mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary placeholder-content-secondary focus:border-accent-primary focus:outline-none"
                placeholder="Say something about this activity..."
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('choice')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
                disabled={saving}
              >
                Back
              </button>
              <button
                onClick={handleCreateLaterPost}
                disabled={saving}
                className="px-4 py-2 rounded-card font-semibold bg-accent-primary text-content-primary hover:bg-opacity-80 disabled:opacity-60"
              >
                {saving ? 'Posting…' : 'Create Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

