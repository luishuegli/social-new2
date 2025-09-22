'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, RotateCcw } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

interface ProfilePictureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => void;
  currentImageUrl?: string;
}

export default function ProfilePictureUploadModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentImageUrl 
}: ProfilePictureUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [hasSelectedNewFile, setHasSelectedNewFile] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fixed crop size for Instagram/X style
  const cropSize = 280;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setHasSelectedNewFile(true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageData({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
        
        // Initialize scale to fit image in crop area (smaller container)
        const containerSize = 320; // Smaller container
        const scaleToFit = Math.min(containerSize / img.width, containerSize / img.height);
        setScale(scaleToFit);
        setPosition({ x: 0, y: 0 });
      };
      img.src = url;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      // Single touch - pan
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ 
        x: touch.clientX - position.x, 
        y: touch.clientY - position.y 
      });
    } else if (e.touches.length === 2) {
      // Two touches - pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1 && isDragging) {
      // Single touch - pan
      const touch = e.touches[0];
      if (!imageData) return;
      
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      // Calculate bounds to keep image within crop area
      const scaledWidth = imageData.width * scale;
      const scaledHeight = imageData.height * scale;
      const maxX = Math.max(0, (scaledWidth - cropSize) / 2);
      const maxY = Math.max(0, (scaledHeight - cropSize) / 2);
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      });
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Two touches - pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = distance / lastTouchDistance;
      setScale(prev => Math.max(0.3, Math.min(4, prev * scaleChange)));
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(null);
  };

  // Handle zooming with the scroll wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const zoomFactor = 0.05;
      // 'deltaY' is negative when scrolling up (zoom in), positive when scrolling down (zoom out)
      const newScale = event.deltaY < 0 
        ? Math.min(4, scale + zoomFactor) 
        : Math.max(0.3, scale - zoomFactor);
      setScale(newScale);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  // Handle dragging to pan the image
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = event.clientX - dragStartRef.current.startX;
      const dy = event.clientY - dragStartRef.current.startY;
      
      // Calculate bounds to keep image within crop area
      if (imageData) {
        const scaledWidth = imageData.width * scale;
        const scaledHeight = imageData.height * scale;
        const maxX = Math.max(0, (scaledWidth - cropSize) / 2);
        const maxY = Math.max(0, (scaledHeight - cropSize) / 2);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, dragStartRef.current.initialX + dx)),
          y: Math.max(-maxY, Math.min(maxY, dragStartRef.current.initialY + dy))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale, imageData]);

  const cropImage = useCallback(() => {
    if (!previewUrl || !canvasRef.current || !imageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to crop size
    canvas.width = cropSize;
    canvas.height = cropSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a circular clipping path
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, 2 * Math.PI);
    ctx.clip();
    
    // Draw the image with the same transforms as the main image
    const img = new Image();
    img.onload = () => {
      const imageAspectRatio = img.width / img.height;
      const containerAspectRatio = 1;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fit to height
        drawHeight = cropSize;
        drawWidth = cropSize * imageAspectRatio;
        offsetX = (cropSize - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller - fit to width
        drawWidth = cropSize;
        drawHeight = cropSize / imageAspectRatio;
        offsetX = 0;
        offsetY = (cropSize - drawHeight) / 2;
      }
      
      // Apply the same scale and position transforms
      ctx.save();
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.scale(scale, scale);
      ctx.translate(position.x, position.y);
      ctx.translate(-cropSize / 2, -cropSize / 2);
      
      // Draw the image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    };
    img.src = previewUrl;
    
    ctx.restore();
  }, [previewUrl, cropSize, scale, position, imageData]);

  const handleSave = async () => {
    if (!canvasRef.current || !previewUrl) return;
    
    setIsUploading(true);
    try {
      console.log('Starting image crop and save...');
      
      // Create a new image and wait for it to load
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });
      
      console.log('Image loaded, starting crop...');
      
      // Now crop the image synchronously
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Set canvas size to crop size
      canvas.width = cropSize;
      canvas.height = cropSize;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      
      // Calculate object-cover behavior
      const imageAspectRatio = img.width / img.height;
      const containerAspectRatio = 1;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fit to height
        drawHeight = cropSize;
        drawWidth = cropSize * imageAspectRatio;
        offsetX = (cropSize - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller - fit to width
        drawWidth = cropSize;
        drawHeight = cropSize / imageAspectRatio;
        offsetX = 0;
        offsetY = (cropSize - drawHeight) / 2;
      }
      
      // Apply the same scale and position transforms
      ctx.save();
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.scale(scale, scale);
      ctx.translate(position.x, position.y);
      ctx.translate(-cropSize / 2, -cropSize / 2);
      
      // Draw the image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
      ctx.restore();
      
      console.log('Image cropped, converting to blob...');
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Canvas blob created:', { size: blob.size, type: blob.type });
          onSave(blob);
          onClose();
        } else {
          console.error('Failed to create blob from canvas');
          setIsUploading(false);
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageData(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setHasSelectedNewFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (previewUrl && imageData) {
      cropImage();
    }
  }, [previewUrl, cropSize, scale, position, cropImage, imageData]);


  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-hidden"
        >
          <LiquidGlass className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-separator">
              <h2 className="text-lg font-semibold text-content-primary">
                Update Profile Picture
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-content-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* File Selection */}
              {!hasSelectedNewFile && (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <Camera className="w-16 h-16 text-content-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-content-primary mb-2">
                      Choose a photo
                    </h3>
                    <p className="text-content-secondary text-sm">
                      Select a photo from your device to use as your profile picture
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-accent-primary text-content-primary rounded-lg font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Photo
                  </button>
                </div>
              )}

              {/* Image Cropping */}
              {hasSelectedNewFile && previewUrl && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-content-primary mb-1">
                      Adjust your photo
                    </h3>
                    <p className="text-content-secondary text-sm">
                      Drag to reposition and scroll to zoom. The circular area shows how it will appear.
                    </p>
                  </div>

                  {/* Cropping Area */}
                  <div 
                    ref={containerRef}
                    className="relative mx-auto w-80 h-80 bg-gray-900 rounded-lg overflow-hidden select-none"
                    style={{ touchAction: 'none' }}
                  >
                    {/* Image Container */}
                    <div
                      className="absolute cursor-move"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                        width: `${cropSize}px`,
                        height: `${cropSize}px`,
                        overflow: 'hidden',
                        borderRadius: '50%',
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onMouseDown={handleMouseDown}
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: 'center',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        }}
                        draggable={false}
                      />
                    </div>
                    
                    {/* Crop Circle Overlay */}
                    <div
                      className="absolute border-2 border-white rounded-full pointer-events-none shadow-lg"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: cropSize,
                        height: cropSize,
                      }}
                    >
                      {/* Rule of thirds grid */}
                      <div className="absolute inset-0">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/60"></div>
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/60"></div>
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/60"></div>
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/60"></div>
                      </div>
                    </div>

                    {/* Dark overlay outside crop area */}
                    <div 
                      className="absolute inset-0 bg-black/60 pointer-events-none"
                      style={{
                        clipPath: `circle(${cropSize/2}px at 50% 50%)`,
                      }}
                    />
                  </div>

                  {/* Live Preview */}
                  <div className="text-center">
                    <p className="text-sm text-content-secondary mb-2 font-medium">Preview</p>
                    <div className="inline-block w-20 h-20 rounded-full overflow-hidden border-2 border-accent-primary shadow-lg">
                      <canvas
                        ref={canvasRef}
                        width={cropSize}
                        height={cropSize}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border-separator mt-4">
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-content-secondary hover:bg-background-secondary rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-content-secondary hover:bg-background-secondary rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!previewUrl || isUploading}
                    className="px-4 py-2 bg-accent-primary text-content-primary rounded-lg text-sm font-medium hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
