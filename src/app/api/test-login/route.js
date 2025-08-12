// src/app/api/test-login/route.js
export async function GET() {
  try {
    console.log('🔐 Testing login status...');
    
    return Response.json({ 
      success: true, 
      message: 'Login test endpoint',
      instructions: [
        '1. Make sure you are logged in to the app',
        '2. Check the browser console for auth state',
        '3. Look for the UserDebugInfo component in the top-right corner',
        '4. If not authenticated, go to /login or use Google sign-in',
        '5. After logging in, try voting again'
      ],
      debugSteps: [
        'Open browser console (F12)',
        'Look for auth-related console logs',
        'Check if user.uid is available',
        'Verify Firebase auth state'
      ],
      testUrls: [
        'http://localhost:3000/login',
        'http://localhost:3000/groups/group-6'
      ]
    });
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 