'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to access camera');
      }
    }
    init();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedUrl(URL.createObjectURL(blob));
        onCapture(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  const retake = () => {
    setCapturedUrl(null);
  };

  return (
    <div className="space-y-3">
      {capturedUrl ? (
        <div className="space-y-3">
          <img src={capturedUrl} alt="Captured" className="w-full rounded-card" />
          <div className="flex gap-2">
            <button onClick={retake} className="px-4 py-2 rounded-card text-content-secondary hover:bg-background-secondary">Retake</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <video ref={videoRef} playsInline muted className="w-full rounded-card bg-black" />
          <div className="flex gap-2">
            <button onClick={capture} className="px-4 py-2 rounded-card font-semibold bg-accent-primary text-content-primary hover:bg-opacity-80">Capture</button>
          </div>
        </div>
      )}
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}


