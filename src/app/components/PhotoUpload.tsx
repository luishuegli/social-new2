'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function PhotoUpload({ 
  onUpload, 
  onCancel, 
  accept = 'image/*',
  maxSizeMB = 10 
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsProcessingImage(true);
    
    // Create preview URL with error handling for macOS compatibility
    try {
      // Method 1: Try URL.createObjectURL (standard approach)
      const url = URL.createObjectURL(file);
      
      // Test if this approach works
      const testImg = new Image();
      testImg.onload = () => {
        console.log('Object URL method successful:', file.name);
        setPreviewUrl(url);
        setIsProcessingImage(false);
      };
      testImg.onerror = async () => {
        console.log('Object URL method failed, trying FileReader approach:', file.name);
        URL.revokeObjectURL(url); // Clean up failed attempt
        
        try {
          // Method 2: Use FileReader as fallback for macOS compatibility
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            console.log('FileReader method successful:', file.name);
            setPreviewUrl(dataUrl);
            setIsProcessingImage(false);
          };
          
          reader.onerror = async () => {
            console.error('FileReader also failed, trying canvas conversion:', file.name);
            
            try {
              // Method 3: Convert file to canvas and regenerate URL
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Directly read file as array buffer and convert to blob
              const fileArrayBuffer = await file.arrayBuffer();
              const blob = new Blob([fileArrayBuffer], { type: file.type });
              
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                
                // Convert canvas to blob and create URL
                canvas.toBlob((canvasBlob) => {
                  if (canvasBlob) {
                    const canvasUrl = URL.createObjectURL(canvasBlob);
                    console.log('Canvas conversion successful:', file.name);
                    setPreviewUrl(canvasUrl);
                    setIsProcessingImage(false);
                  } else {
                    setError(`Unsupported image format: ${file.name}`);
                    setIsProcessingImage(false);
                  }
                }, 'image/jpeg', 0.9);
              };
              
              img.src = URL.createObjectURL(blob);
            } catch (canvasError) {
              console.error('Canvas conversion failed:', canvasError);
              setError(`Unable to preview this image: ${file.name}. Please try a different file.`);
              setIsProcessingImage(false);
            }
          };
          
          reader.readAsDataURL(file);
        } catch (readerError) {
          console.error('FileReader method failed:', readerError);
          setError(`Unable to read this file: ${file.name}`);
          setIsProcessingImage(false);
        }
      };
      
      testImg.src = url;
      
    } catch (error) {
      console.error('Error creating object URL:', error);
      setError(error instanceof Error ? error.message : 'Failed to preview image');
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {selectedFile ? (
        // Preview selected image or show processing indicator
        <div className="space-y-4">
          <div className="relative">
            {isProcessingImage ? (
              <div className="w-full h-64 bg-background-secondary rounded-card shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="">Processing image...</div>
                  <div className="mt-2 text-xs text-content-secondary">{selectedFile.name}</div>
                </div>
              </div>
            ) : previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Selected" 
                className="w-full rounded-card shadow-lg max-h-96 object-cover"
              onLoad={() => console.log('Preview image rendered successfully')}
              onError={(e) => {
                console.error('Preview image failed to render:', e);
                // Add some debugging info
                setTimeout(() => {
                  const img = e.target as HTMLImageElement;
                  console.log('Image src:', img.src);
                  console.log('Image complete:', img.complete);
                  console.log('Image naturalWidth:', img.naturalWidth);
                  
                  // Try to reload the image with the same URL
                  const originalSrc = img.src;
                  img.src = '';
                  img.src = originalSrc;
                }, 100);
              }}
            />
            ) : (
              <div className="w-full h-64 bg-background-secondary rounded-card shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-content-secondary">Error loading preview</div>
                  <div className="mt-2 text-xs text-content-tertiary">{selectedFile.name}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {selectedFile.name}
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-accent-primary text-background-primary rounded-card font-semibold hover:bg-opacity-80 transition-colors"
            >
              Use This Photo
            </button>
            <button
              onClick={handleRemove}
              className="px-4 py-3 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
            >
              Choose Different
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
      ) : (
        // File selection interface
        <div className="space-y-4">
          <div
            className={`
              border-2 border-dashed rounded-card p-8 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-accent-primary bg-accent-primary/5' 
                : 'border-border-separator hover:border-accent-primary hover:bg-accent-primary/5'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-accent-primary" />
            </div>
            
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              Choose a photo
            </h3>
            
            <p className="text-content-secondary mb-4">
              Drag and drop your photo here, or click to browse
            </p>
            
            <div className="text-xs text-content-tertiary">
              Supports JPG, PNG, GIF up to {maxSizeMB}MB
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Manual browse button */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={triggerFileInput}
              className="flex items-center gap-2 px-4 py-3 border border-border-separator text-content-secondary rounded-card hover:bg-background-secondary transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Browse Files
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

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-card">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
