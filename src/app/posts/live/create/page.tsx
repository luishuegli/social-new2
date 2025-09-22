'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import AppLayout from '@/app/components/AppLayout';
import CameraCapture from '@/app/components/CameraCapture';
import { usePostableActivities } from '@/app/hooks/useActivities';
import { db, storage } from '@/app/Lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ArrowLeft, Zap, MapPin, Calendar } from 'lucide-react';
import { analyzeBlobAspectRatio, getAspectRatioClasses } from '../../../utils/imageUtils';

export default function LivePostCreatePage() {
  const { user } = useAuth();
  const { activities: postableActivities, loading, error } = usePostableActivities();
  const router = useRouter();
  
  const [step, setStep] = useState<'camera' | 'caption'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('aspect-[4/3]');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Redirect to regular post creation if no postable activities or if there's an error
  useEffect(() => {
    if (!loading && (postableActivities.length === 0 || error)) {
      router.push('/posts/create');
    }
  }, [loading, postableActivities.length, error, router]);

  const handlePhotoCapture = async (blob: Blob) => {
    setCapturedPhoto(blob);
    const ratio = await analyzeBlobAspectRatio(blob);
    setImageAspectRatio(getAspectRatioClasses(ratio));
    setStep('caption');
  };

  const handlePost = async () => {
    if (!user || !capturedPhoto || !postableActivities[0]) {
      setPostError('Missing required information');
      return;
    }

    setIsPosting(true);
    setPostError(null);

    try {
      // Upload photo to Firebase Storage
      const timestamp = Date.now();
      const fileName = `live-posts/${user.uid}/${timestamp}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, capturedPhoto);
      const imageUrl = await getDownloadURL(storageRef);

      // Create post document
      const activity = postableActivities[0];
      const postDoc = {
        // Author info
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorAvatar: user.profilePictureUrl || user.photoURL || '',
        
        // Activity info
        activityTitle: activity.title,
        activityCategory: activity.type || 'General',
        activityDate: activity.date ? activity.date.toISOString() : new Date().toISOString(),
        activityDescription: '',
        
        // Post content
        description: caption.trim(),
        imageUrl,
        media: [{ url: imageUrl, type: 'image' }],
        
        // Post metadata
        authenticityType: 'Live Post',
        postType: 'Individual',
        visibility: 'public',
        
        // Timestamps
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        
        // Engagement
        likes: 0,
        comments: 0,
      };

      await addDoc(collection(db, 'posts'), postDoc);
      
      // Navigate to home feed
      router.push('/home');
      
    } catch (error) {
      console.error('Failed to create live post:', error);
      setPostError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const goBack = () => {
    if (step === 'caption') {
      setStep('camera');
      setCapturedPhoto(null);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-content-secondary">Checking active activities...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (postableActivities.length === 0 || error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass p-6 text-center">
            <div className="text-content-secondary">Redirecting...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const activity = postableActivities[0];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="liquid-glass p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-content-secondary" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-primary" />
              <h1 className="text-heading-1 font-bold text-content-primary">Live Post</h1>
            </div>
          </div>
          
          <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-card p-4">
            <h3 className="font-semibold text-content-primary mb-1">{activity.title}</h3>
            <p className="text-sm text-content-secondary flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              {activity.location || 'Current location'}
              <span className="mx-1">•</span>
              <Calendar className="w-3 h-3" />
              {new Date(activity.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="liquid-glass p-4 sm:p-6">
          {step === 'camera' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-content-primary mb-2">
                  Capture the moment
                </h2>
                <p className="text-content-secondary">
                  Take a live photo to share with your group
                </p>
              </div>
              
              <CameraCapture 
                onCapture={handlePhotoCapture}
                onCancel={() => router.back()}
                showRetake={false}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-content-primary mb-2">
                  Add a caption
                </h2>
                <p className="text-content-secondary">
                  Share what's happening right now
                </p>
              </div>

              {/* Photo preview */}
              {capturedPhoto && (
                <div className="relative">
                  <div className={`w-full ${imageAspectRatio} rounded-card shadow-lg overflow-hidden`}>
                    <img 
                      src={URL.createObjectURL(capturedPhoto)} 
                      alt="Captured" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              )}

              {/* Caption input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-content-primary">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's happening right now?"
                  className="w-full px-4 py-3 bg-background-secondary border border-border-separator rounded-card text-content-primary placeholder-content-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-content-tertiary text-right">
                  {caption.length}/500
                </div>
              </div>

              {/* Error message */}
              {postError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-card">
                  <p className="text-red-500 text-sm">{postError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  disabled={isPosting}
                  className="flex-1 px-4 py-3 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retake Photo
                </button>
                <button
                  onClick={handlePost}
                  disabled={isPosting}
                  className="flex-1 px-4 py-3 bg-accent-primary text-background-primary rounded-card font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-background-primary border-t-transparent rounded-full"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Post Live
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

