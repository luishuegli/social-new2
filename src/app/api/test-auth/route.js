// src/app/api/test-auth/route.js
import { auth } from '../../Lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export async function GET() {
  try {
    console.log('🔐 Testing authentication...');
    
    return Response.json({ 
      success: true, 
      message: 'Authentication test endpoint',
      note: 'This endpoint is for testing. Check the server logs for auth state.',
      instructions: [
        '1. Check if user is logged in via browser',
        '2. Check browser console for auth state',
        '3. Verify user.uid is available in components'
      ]
    });
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 