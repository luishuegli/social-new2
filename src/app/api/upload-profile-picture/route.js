import { NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage, FieldValue } from '../../Lib/firebaseAdmin';

export async function POST(request) {
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
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get the form data
    const formData = await request.formData();
    const profilePicture = formData.get('profilePicture');

    if (!profilePicture) {
      return NextResponse.json({ 
        success: false, 
        error: 'No profile picture provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!profilePicture.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be an image' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (profilePicture.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    let publicUrl;

    try {
      // Try Firebase Storage first
      console.log('Attempting to upload to Firebase Storage...');
      const bucket = adminStorage.bucket();
      const fileName = `profile-pictures/${userId}/${Date.now()}_${profilePicture.name}`;
      const file = bucket.file(fileName);

      // Convert File to Buffer
      const arrayBuffer = await profilePicture.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload the file
      await file.save(buffer, {
        metadata: {
          contentType: profilePicture.type,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make the file publicly readable
      await file.makePublic();

      // Get the public URL
      publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('✅ Successfully uploaded to Firebase Storage:', publicUrl);

    } catch (storageError) {
      console.warn('Firebase Storage upload failed, falling back to base64:', storageError);
      
      // Fallback to base64 storage in Firestore
      const arrayBuffer = await profilePicture.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      publicUrl = `data:${profilePicture.type};base64,${base64}`;
      console.log('Using base64 fallback');
    }

    // Update the user's profile in Firestore
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      profilePictureUrl: publicUrl,
      photoURL: publicUrl, // Also update photoURL for consistency
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Profile picture uploaded to Storage and updated in Firestore for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePictureUrl: publicUrl
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}