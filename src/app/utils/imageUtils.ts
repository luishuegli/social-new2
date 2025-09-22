/**
 * Image utility functions for aspect ratio handling
 */

export type AspectRatio = '4:3' | '3:4' | '1:1';

/**
 * Determines the best aspect ratio for an image based on its dimensions
 */
export function getOptimalAspectRatio(width: number, height: number): AspectRatio {
  // Enhanced safety checks for invalid dimensions
  if (!width || !height || width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
    return '4:3'; // Default fallback
  }
  
  const ratio = width / height;
  
  // Additional safety check for invalid ratio
  if (!isFinite(ratio) || ratio <= 0) {
    return '4:3'; // Default fallback
  }
  
  // Square-ish images (0.8 to 1.2 ratio)
  if (ratio >= 0.8 && ratio <= 1.2) {
    return '1:1';
  }
  
  // Landscape images (wider than tall)
  if (ratio > 1.2) {
    return '4:3';
  }
  
  // Portrait images (taller than wide)
  return '3:4';
}

/**
 * Gets CSS aspect ratio value for the given ratio
 */
export function getAspectRatioCSS(ratio: AspectRatio): string {
  switch (ratio) {
    case '4:3':
      return '4/3';
    case '3:4':
      return '3/4';
    case '1:1':
      return '1/1';
    default:
      return '4/3';
  }
}

/**
 * Gets Tailwind classes for aspect ratio
 */
export function getAspectRatioClasses(ratio: AspectRatio): string {
  switch (ratio) {
    case '4:3':
      return 'aspect-[4/3]';
    case '3:4':
      return 'aspect-[3/4]';
    case '1:1':
      return 'aspect-square';
    default:
      return 'aspect-[4/3]';
  }
}

/**
 * Analyzes an image file and returns optimal aspect ratio
 */
export async function analyzeImageAspectRatio(file: File): Promise<AspectRatio> {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.onload = () => {
        try {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = getOptimalAspectRatio(img.naturalWidth, img.naturalHeight);
            resolve(ratio);
          } else {
            resolve('4:3'); // Fallback for invalid dimensions
          }
        } catch (error) {
          console.warn('Error analyzing image aspect ratio:', error);
          resolve('4:3'); // Fallback on error
        }
      };
      img.onerror = () => {
        resolve('4:3'); // Fallback on error
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.warn('Error creating image for analysis:', error);
      resolve('4:3'); // Fallback on error
    }
  });
}

/**
 * Analyzes a blob and returns optimal aspect ratio
 */
export async function analyzeBlobAspectRatio(blob: Blob): Promise<AspectRatio> {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.onload = () => {
        try {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = getOptimalAspectRatio(img.naturalWidth, img.naturalHeight);
            URL.revokeObjectURL(img.src); // Clean up
            resolve(ratio);
          } else {
            URL.revokeObjectURL(img.src); // Clean up
            resolve('4:3'); // Fallback for invalid dimensions
          }
        } catch (error) {
          console.warn('Error analyzing blob aspect ratio:', error);
          URL.revokeObjectURL(img.src); // Clean up
          resolve('4:3'); // Fallback on error
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src); // Clean up
        resolve('4:3'); // Fallback on error
      };
      img.src = URL.createObjectURL(blob);
    } catch (error) {
      console.warn('Error creating image for blob analysis:', error);
      resolve('4:3'); // Fallback on error
    }
  });
}
