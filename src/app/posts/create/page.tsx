'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/app/components/AppLayout';
import { useAuth } from '@/app/contexts/AuthContext';
import { db, storage } from '@/app/Lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/app/components/CameraCapture';
import PhotoUpload from '@/app/components/PhotoUpload';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { analyzeImageAspectRatio, analyzeBlobAspectRatio, getAspectRatioClasses } from '../../utils/imageUtils';

type ActivityFormState = {
  title: string;
  category: string;
  date: string; // yyyy-mm-dd
  description: string;
};

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'photo-choice' | 'camera' | 'upload' | 'activity' | 'final'>('photo-choice');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityFormState>({
    title: '',
    category: '',
    date: '',
    description: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'upload' | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('aspect-[4/3]');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');

  const canContinueFromActivity = useMemo(() => {
    return (
      activity.title.trim().length > 0 &&
      activity.category.trim().length > 0 &&
      activity.date.trim().length > 0 &&
      activity.description.trim().length > 0
    );
  }, [activity]);

  const handleCreatePost = async () => {
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
        authenticityType: 'Live Post' | 'Later Post';
        postType: 'Individual';
        visibility: 'public' | 'followers' | 'private';
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
        authenticityType: 'Later Post',
        postType: 'Individual',
        visibility,

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
          <p className="text-content-secondary mt-2">Start by adding a photo, then tell us about your activity.</p>
        </div>

        {/* Step 1: Photo Choice */}
        {step === 'photo-choice' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Add a Photo</h2>
            <p className="text-content-secondary">How would you like to add a photo to your post?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setStep('upload')}
                className="w-full px-4 py-6 rounded-card border border-border-separator text-left hover:bg-background-secondary transition-colors"
              >
                <div className="flex items-center gap-3 font-semibold text-content-primary">
                  <Upload className="w-5 h-5" />
                  Upload Photo
                </div>
                <div className="text-content-secondary mt-1">Choose from your device or gallery</div>
              </button>
              <button
                onClick={() => setStep('camera')}
                className="w-full px-4 py-6 rounded-card border border-border-separator text-left hover:bg-background-secondary transition-colors"
              >
                <div className="flex items-center gap-3 font-semibold text-content-primary">
                  <Camera className="w-5 h-5" />
                  Take Photo
                </div>
                <div className="text-content-secondary mt-1">Use your camera to capture now</div>
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2a: Upload Photo */}
        {step === 'upload' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Upload Photo</h2>
            
            <PhotoUpload 
              onUpload={async (file) => {
                setImageFile(file);
                setPhotoSource('upload');
                const ratio = await analyzeImageAspectRatio(file);
                setImageAspectRatio(getAspectRatioClasses(ratio));
                setStep('activity');
              }}
              onCancel={() => setStep('photo-choice')}
              maxSizeMB={10}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('photo-choice')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2b: Camera Capture */}
        {step === 'camera' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Take Photo</h2>
            <p className="text-content-secondary">Capture a photo for your post</p>
            
            <CameraCapture 
              onCapture={async (blob) => {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                setImageFile(file);
                setPhotoSource('camera');
                const ratio = await analyzeBlobAspectRatio(blob);
                setImageAspectRatio(getAspectRatioClasses(ratio));
                setStep('activity');
              }}
              onCancel={() => setStep('photo-choice')}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('photo-choice')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Activity Details */}
        {step === 'activity' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Activity Details</h2>
            <p className="text-content-secondary">Tell us about the activity this photo represents.</p>

            {/* Photo Preview */}
            {imageFile && (
              <div className="space-y-3">
                <div className="relative">
                  <div className={`w-full ${imageAspectRatio} rounded-card shadow-lg overflow-hidden`}>
                    <img 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Selected" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {photoSource === 'camera' ? (
                      <>
                        <Camera className="w-3 h-3" />
                        Captured
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Uploaded
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setStep('photo-choice')}
                  className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            )}

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

            <div className="flex justify-between">
              <button
                onClick={() => setStep(photoSource === 'camera' ? 'camera' : 'upload')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
              >
                Back
              </button>
              <button
                disabled={!canContinueFromActivity}
                onClick={() => setStep('final')}
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

        {/* Step 4: Final Details & Post */}
        {step === 'final' && (
          <div className="liquid-glass p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-heading-2 font-semibold text-content-primary">Finalize Your Post</h2>

            {/* Photo Preview */}
            {imageFile && (
              <div className="space-y-3">
                <div className="relative">
                  <div className={`w-full ${imageAspectRatio} rounded-card shadow-lg overflow-hidden`}>
                    <img 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Selected" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white px-3 py-2 rounded text-sm">
                    <div className="font-semibold">{activity.title}</div>
                    <div className="text-xs opacity-90">{activity.category} • {activity.date ? new Date(activity.date).toLocaleDateString() : 'Date TBD'}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-content-secondary mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary placeholder-content-secondary focus:border-accent-primary focus:outline-none"
                placeholder="Share your thoughts about this activity..."
                maxLength={500}
              />
              <div className="text-xs text-content-tertiary text-right">
                {caption.length}/500
              </div>
            </div>

            <div>
              <label className="block text-content-secondary mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-input text-content-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="followers">Followers - Only followers can see</option>
                <option value="private">Private - Only you can see</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-card">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('activity')}
                className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary"
                disabled={saving}
              >
                Back
              </button>
              <button
                onClick={handleCreatePost}
                disabled={saving || !imageFile}
                className="px-4 py-2 rounded-card font-semibold bg-accent-primary text-content-primary hover:bg-opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-background-primary border-t-transparent rounded-full"></div>
                    Creating Post…
                  </div>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

