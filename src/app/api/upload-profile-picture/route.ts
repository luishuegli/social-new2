import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage, FieldValue } from '@/app/Lib/firebaseAdmin';
import { logger } from '@/lib/logger';

// Try to import sharp, but make it optional
let sharp: any;
try {
  sharp = require('sharp');
} catch (e) {
  logger.warn('Sharp not available for image optimization', undefined, 'upload-profile-picture');
}

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// Image optimization settings
const IMAGE_OPTIMIZATION = {
  profilePicture: {
    width: 400,
    height: 400,
    quality: 85
  },
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80
  }
};

/**
 * Upload and optimize profile picture
 * POST /api/upload-profile-picture
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      logger.error('Token verification failed', error, 'upload-profile-picture');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get the form data
    const formData = await request.formData();
    const profilePicture = formData.get('profilePicture') as File | null;

    if (!profilePicture) {
      return NextResponse.json({ 
        success: false, 
        error: 'No profile picture provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(profilePicture.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP' 
      }, { status: 400 });
    }

    // Validate file size
    if (profilePicture.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    // Convert File to Buffer for processing
    const arrayBuffer = await profilePicture.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info('Processing profile picture upload', { 
      userId, 
      originalSize: profilePicture.size,
      type: profilePicture.type 
    }, 'upload-profile-picture');

    // Check if sharp is available (it might not be in some environments)
    let optimizedBuffer: Buffer;
    let thumbnailBuffer: Buffer | null = null;
    
    if (sharp) {
      try {
        // Optimize the main profile picture
        optimizedBuffer = await sharp(buffer)
          .resize(
            IMAGE_OPTIMIZATION.profilePicture.width, 
            IMAGE_OPTIMIZATION.profilePicture.height, 
            { 
              fit: 'cover',
              withoutEnlargement: true 
            }
          )
          .jpeg({ 
            quality: IMAGE_OPTIMIZATION.profilePicture.quality,
            progressive: true 
          })
          .toBuffer();

        // Create a thumbnail version
        thumbnailBuffer = await sharp(buffer)
          .resize(
            IMAGE_OPTIMIZATION.thumbnail.width,
            IMAGE_OPTIMIZATION.thumbnail.height,
            { 
              fit: 'cover',
              withoutEnlargement: true 
            }
          )
          .jpeg({ 
            quality: IMAGE_OPTIMIZATION.thumbnail.quality,
            progressive: true 
          })
          .toBuffer();

        logger.debug('Image optimization complete', { 
          originalSize: buffer.length,
          optimizedSize: optimizedBuffer.length,
          thumbnailSize: thumbnailBuffer?.length,
          compressionRatio: ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(2) + '%'
        }, 'upload-profile-picture');

      } catch (sharpError) {
        // If sharp fails, fall back to original buffer
        logger.warn('Sharp optimization failed, using original image', sharpError, 'upload-profile-picture');
        optimizedBuffer = buffer;
      }
    } else {
      // Sharp not available, use original buffer
      logger.info('Using original image (optimization not available)', undefined, 'upload-profile-picture');
      optimizedBuffer = buffer;
    }

    let publicUrl: string;
    let thumbnailUrl: string | undefined;

    try {
      // Upload to Firebase Storage
      logger.debug('Uploading to Firebase Storage...', undefined, 'upload-profile-picture');
      
      const bucket = adminStorage.bucket();
      const timestamp = Date.now();
      const safeFileName = profilePicture.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Upload main profile picture
      const fileName = `profile-pictures/${userId}/${timestamp}_${safeFileName}`;
      const file = bucket.file(fileName);

      await file.save(optimizedBuffer, {
        metadata: {
          contentType: 'image/jpeg', // Always save as JPEG after optimization
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            originalName: profilePicture.name,
            originalSize: profilePicture.size.toString(),
            optimizedSize: optimizedBuffer.length.toString()
          },
        },
      });

      // Make the file publicly readable
      await file.makePublic();

      // Get the public URL
      publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      // Upload thumbnail if created
      if (thumbnailBuffer) {
        const thumbnailFileName = `profile-pictures/${userId}/thumbnails/${timestamp}_${safeFileName}`;
        const thumbnailFile = bucket.file(thumbnailFileName);
        
        await thumbnailFile.save(thumbnailBuffer, {
          metadata: {
            contentType: 'image/jpeg',
            metadata: {
              uploadedBy: userId,
              uploadedAt: new Date().toISOString(),
              isThumbnail: 'true'
            },
          },
        });
        
        await thumbnailFile.makePublic();
        thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailFileName}`;
      }
      
      logger.info('Successfully uploaded to Firebase Storage', { 
        publicUrl, 
        thumbnailUrl 
      }, 'upload-profile-picture');

    } catch (storageError: any) {
      logger.error('Firebase Storage upload failed', storageError, 'upload-profile-picture');
      
      // Don't fallback to base64 for large images - return error instead
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload image to storage. Please try again.' 
      }, { status: 500 });
    }

    // Update the user's profile in Firestore
    const userRef = adminDb.collection('users').doc(userId);
    
    const updateData: any = {
      profilePictureUrl: publicUrl,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (thumbnailUrl) {
      updateData.profilePictureThumbnail = thumbnailUrl;
    }
    
    await userRef.update(updateData);

    const processingTime = Date.now() - startTime;
    logger.info('Profile picture uploaded and updated successfully', { 
      userId,
      processingTime: `${processingTime}ms` 
    }, 'upload-profile-picture');

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePictureUrl: publicUrl,
      thumbnailUrl,
      processingTime
    });

  } catch (error: any) {
    logger.error('Error uploading profile picture', error, 'upload-profile-picture');
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload profile picture' 
    }, { status: 500 });
  }
}
