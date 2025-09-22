'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, RotateCcw } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

interface ProfilePictureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => void;
}

const CROP_AREA_SIZE = 280;
const MAX_SCALE = 4;

export default function ProfilePictureUploadModal({
  isOpen,
  onClose,
  onSave,
}: ProfilePictureUploadModalProps) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const resetState = useCallback(() => {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    setSourceUrl(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [sourceUrl]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetState, 300); // Reset after exit animation
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Prevent page zoom when modal is open
      const preventZoom = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };
      
      const preventTouchZoom = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('wheel', preventZoom, { passive: false });
      document.addEventListener('touchstart', preventTouchZoom, { passive: false });
      document.addEventListener('touchmove', preventTouchZoom, { passive: false });
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('wheel', preventZoom);
        document.removeEventListener('touchstart', preventTouchZoom);
        document.removeEventListener('touchmove', preventTouchZoom);
      };
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      resetState();
      const url = URL.createObjectURL(file);
      setSourceUrl(url);
    }
  };

  const onImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const { naturalWidth, naturalHeight } = img;

    const scaleToCover = Math.max(CROP_AREA_SIZE / naturalWidth, CROP_AREA_SIZE / naturalHeight);
    // Start 6x more zoomed in
    const initialScale = scaleToCover * 6;
    
    setMinScale(scaleToCover); // Allow zooming out to minimum
    setScale(initialScale); // Start zoomed out to see more of the image
    setPosition({ x: 0, y: 0 });
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = { startX: touch.clientX, startY: touch.clientY, initialX: position.x, initialY: position.y };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      onDrag(touch.clientX, touch.clientY);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const dx = clientX - dragStartRef.current.startX;
    const dy = clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.initialX + dx;
    const newY = dragStartRef.current.initialY + dy;

    // Move exactly with mouse - no constraints during drag for smooth movement
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Apply constraints after drag ends to keep image within reasonable bounds
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      const scaledWidth = naturalWidth * scale;
      const scaledHeight = naturalHeight * scale;
      
      const maxX = Math.max(0, (scaledWidth - CROP_AREA_SIZE) / 2);
      const maxY = Math.max(0, (scaledHeight - CROP_AREA_SIZE) / 2);

      setPosition(prev => ({
        x: Math.max(-maxX, Math.min(maxX, prev.x)),
        y: Math.max(-maxY, Math.min(maxY, prev.y)),
      }));
    }
  }, [scale]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onDrag(e.clientX, e.clientY);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', onDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', onDragEnd);
    };
  }, [isDragging, onDrag, onDragEnd]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newScale = scale + e.deltaY * -0.005;
    setScale(Math.max(minScale, Math.min(MAX_SCALE, newScale)));
  };

  // Update preview whenever position or scale changes
  useEffect(() => {
    if (!previewCanvasRef.current || !cropContainerRef.current || !imageRef.current || !sourceUrl) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, 100, 100);
    
    // Apply circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2);
    ctx.clip();
    
    // Create a temporary canvas to capture the crop area
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CROP_AREA_SIZE;
    tempCanvas.height = CROP_AREA_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Apply circular clipping to temp canvas
    tempCtx.beginPath();
    tempCtx.arc(CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2, 0, Math.PI * 2);
    tempCtx.clip();
    
    // Apply the EXACT same transform as the visible image
    tempCtx.save();
    tempCtx.translate(CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2);
    tempCtx.translate(position.x, position.y);
    tempCtx.scale(scale, scale);
    
    // Draw image centered
    tempCtx.drawImage(
      imageRef.current,
      -imageRef.current.naturalWidth / 2,
      -imageRef.current.naturalHeight / 2,
      imageRef.current.naturalWidth,
      imageRef.current.naturalHeight
    );
    
    tempCtx.restore();
    
    // Now scale the temp canvas to preview size
    ctx.drawImage(
      tempCanvas,
      0, 0, CROP_AREA_SIZE, CROP_AREA_SIZE,
      0, 0, 100, 100
    );
    
    ctx.restore();
  }, [position, scale, sourceUrl]);

  const onSaveClick = async () => {
    if (!sourceUrl || !imageRef.current) return;

    const img = imageRef.current;
    
    // Create a temporary canvas to capture EXACTLY what's visible in the crop circle
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CROP_AREA_SIZE;
    tempCanvas.height = CROP_AREA_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Apply circular clipping to match the crop view
    tempCtx.beginPath();
    tempCtx.arc(CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2, 0, Math.PI * 2);
    tempCtx.clip();

    // Replicate the EXACT transform from the crop view
    // The CSS transform is: translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})
    tempCtx.save();
    
    // Move to center of canvas
    tempCtx.translate(CROP_AREA_SIZE / 2, CROP_AREA_SIZE / 2);
    
    // Apply the position offset
    tempCtx.translate(position.x, position.y);
    
    // Apply the scale
    tempCtx.scale(scale, scale);
    
    // Draw the image centered (the -50%, -50% part)
    tempCtx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    
    tempCtx.restore();

    // Now create the final output canvas
    const outputCanvas = document.createElement('canvas');
    const outputSize = 400;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    // Apply circular clipping to output
    outputCtx.beginPath();
    outputCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    outputCtx.clip();

    // Draw the temporary canvas scaled to the output size
    outputCtx.drawImage(
      tempCanvas,
      0, 0, CROP_AREA_SIZE, CROP_AREA_SIZE,
      0, 0, outputSize, outputSize
    );
    
    outputCanvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md"
          >
            <LiquidGlass className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-white">Edit profile picture</h2>
                <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                {sourceUrl ? (
                  <>
                    <div
                      ref={cropContainerRef}
                      className="relative mx-auto bg-black overflow-hidden select-none cursor-grab active:cursor-grabbing"
                      style={{ 
                        width: CROP_AREA_SIZE, 
                        height: CROP_AREA_SIZE, 
                        borderRadius: '50%',
                        touchAction: 'none'
                      }}
                      onWheel={onWheel}
                      onMouseDown={onDragStart}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      <img
                        ref={imageRef}
                        src={sourceUrl}
                        alt="Crop"
                        onLoad={onImageLoad}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        }}
                        draggable={false}
                      />
                       <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-full">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                      </div>
                    </div>
                    
                    {/* Live Preview - Shows exactly what will be saved */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-white/50 mb-2">Final result preview:</p>
                      <canvas
                        ref={previewCanvasRef}
                        width={100}
                        height={100}
                        className="mx-auto rounded-full border-2 border-white/30"
                        style={{ width: '100px', height: '100px' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ height: CROP_AREA_SIZE }} className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-medium text-white mb-2">Upload a photo</h3>
                    <p className="text-white/70 text-sm mb-4">Your photo will be cropped to a circle.</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white font-semibold rounded-lg hover:bg-opacity-80">
                        <Upload size={16} /> Choose File
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 flex justify-between items-center border-t border-white/20">
                <button onClick={resetState} className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
                  <RotateCcw size={16} /> Reset
                </button>
                <button onClick={onSaveClick} disabled={!sourceUrl} className="px-6 py-2 bg-accent-primary text-white font-semibold rounded-lg hover:bg-opacity-80 disabled:opacity-50">
                  Save
                </button>
              </div>
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}