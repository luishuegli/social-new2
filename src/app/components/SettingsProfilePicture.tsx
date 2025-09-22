'use client';

import React, { useState } from 'react';
import { Camera, Upload, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LiquidGlass from '@/components/ui/LiquidGlass';
import ProfilePictureUploadModal from '@/components/profile/ProfilePictureUploadModal';
import CameraCapture from './CameraCapture';

export default function SettingsProfilePicture() {
  const { user, updateProfile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear messages after 5 seconds
  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleFileUpload = async (croppedImageBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create FormData with the cropped image
      const formData = new FormData();
      formData.append('profilePicture', croppedImageBlob, 'profile-picture.jpg');

      // Get user token
      const token = await user.getIdToken();

      // Upload to backend
      const response = await fetch('/api/upload-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload profile picture');
      }

      // Update the user's profile picture URL in the auth context
      if (updateProfile) {
        await updateProfile({
          photoURL: result.profilePictureUrl,
        });
      }

      setSuccess('Profile picture updated successfully!');
      console.log('Profile picture uploaded successfully:', result.profilePictureUrl);

    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (imageBlob: Blob) => {
    setShowCamera(false);
    // Convert camera capture to file and trigger upload
    await handleFileUpload(imageBlob);
  };

  const openUploadModal = () => {
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const openCamera = () => {
    setShowCamera(true);
    setError(null);
    setSuccess(null);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <LiquidGlass className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-primary mb-2">
              Profile Picture
            </h2>
            <p className="text-content-secondary text-sm mb-4">
              Update your profile picture to help others recognize you
            </p>
          </div>
          
          {/* Current Profile Picture */}
          <div className="flex-shrink-0 ml-4">
            <div className="w-20 h-20 rounded-full bg-accent-primary flex items-center justify-center overflow-hidden border-2 border-border-separator">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-content-secondary" />
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-support-error/10 border border-support-error/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-support-error flex-shrink-0" />
            <p className="text-support-error text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-support-success/10 border border-support-success/20 rounded-lg">
            <p className="text-support-success text-sm">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openUploadModal}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-content-primary rounded-lg font-medium hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </button>

          <button
            onClick={openCamera}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-background-secondary text-content-primary rounded-lg font-medium hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>

        <p className="text-content-tertiary text-xs mt-3">
          Recommended: Square image, at least 400x400 pixels. Max file size: 5MB.
        </p>
      </LiquidGlass>

      {/* Upload Modal */}
      <ProfilePictureUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleFileUpload}
        currentImageUrl={user.photoURL || undefined}
      />

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg">
            <LiquidGlass className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-content-primary mb-2">
                  Take Profile Picture
                </h2>
                <p className="text-content-secondary text-sm">
                  Position yourself in the camera and take a photo
                </p>
              </div>
              
              <CameraCapture
                onCapture={handleCameraCapture}
                onCancel={() => setShowCamera(false)}
                showRetake={true}
                aspectRatio="square"
              />
            </LiquidGlass>
          </div>
        </div>
      )}
    </>
  );
}
