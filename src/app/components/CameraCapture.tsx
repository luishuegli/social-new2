'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, CheckCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel?: () => void;
  showRetake?: boolean;
  aspectRatio?: 'square' | 'standard';
}

export default function CameraCapture({ onCapture, onCancel, showRetake = true, aspectRatio = 'standard' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const initCamera = async (preferredFacingMode: 'user' | 'environment' = 'environment') => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Enhanced constraints for better desktop/mobile support
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setFacingMode(preferredFacingMode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (e: any) {
      console.error('Camera init error:', e);
      setError(e?.message || 'Unable to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    
    if (aspectRatio === 'square') {
      // For square aspect ratio, crop to the smaller dimension centered
      const size = Math.min(sourceWidth, sourceHeight);
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Calculate crop offsets to center the image
      const offsetX = (sourceWidth - size) / 2;
      const offsetY = (sourceHeight - size) / 2;
      
      // Draw cropped square from video
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    } else {
      // Standard aspect ratio - use full dimensions
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw the full video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedUrl(URL.createObjectURL(blob));
        onCapture(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    setCapturedUrl(null);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    await initCamera(newFacingMode);
  };

  if (error) {
    return (
      <div className="liquid-glass p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-content-primary mb-2">Camera Access Required</h3>
        <p className="text-content-secondary mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => initCamera(facingMode)}
            className="px-4 py-2 bg-accent-primary text-background-primary rounded-card hover:bg-opacity-80 transition-colors"
          >
            Try Again
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {capturedUrl ? (
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={capturedUrl} 
              alt="Captured" 
              className={`w-full rounded-card shadow-lg ${aspectRatio === 'square' ? 'aspect-square object-cover' : ''}`} 
            />
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Captured
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            {showRetake && (
              <button 
                onClick={retake} 
                className="flex items-center gap-2 px-4 py-2 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>
            )}
            {onCancel && (
              <button 
                onClick={onCancel}
                className="px-4 py-2 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              className={`w-full rounded-card bg-black shadow-lg ${aspectRatio === 'square' ? 'aspect-square object-cover' : ''}`}
              style={{ minHeight: aspectRatio === 'square' ? 'auto' : '300px' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-card">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={capture} 
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-background-primary rounded-card font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
            
            <button 
              onClick={switchCamera}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Switch Camera
            </button>
            
            {onCancel && (
              <button 
                onClick={onCancel}
                className="px-4 py-3 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


