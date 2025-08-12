// src/app/api/test-new-structure/route.js
import { testNewStructure } from '../../../lib/testNewStructure';

export async function GET() {
  try {
    console.log('🧪 Starting new structure test via GET...');
    
    // Test Firebase connection first
    const { db } = await import('../../../app/Lib/firebase');
    const { collection, getDocs } = await import('firebase/firestore');
    
    console.log('🔥 Testing Firebase connection...');
    const testRef = collection(db, 'users');
    const testSnapshot = await getDocs(testRef);
    console.log('✅ Firebase connection successful, found', testSnapshot.docs.length, 'users');
    
    // Now run the test
    await testNewStructure();
    
    return Response.json({ 
      success: true, 
      message: 'New structure test completed successfully!',
      firebaseConnected: true,
      usersFound: testSnapshot.docs.length
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 Starting new structure test via POST...');
    await testNewStructure();
    
    return Response.json({ 
      success: true, 
      message: 'New structure test completed successfully!' 
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 