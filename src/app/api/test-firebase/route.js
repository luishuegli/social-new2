import { NextResponse } from 'next/server';
import { db } from '../../Lib/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    // Test 1: Basic Firebase connection
    console.log('🔥 Testing Firebase connection...');
    
    // Test 2: Write a test document
    const testRef = collection(db, 'test-connection');
    const testDoc = await addDoc(testRef, {
      message: 'Firebase connection test',
      timestamp: serverTimestamp(),
      testId: `test-${Date.now()}`
    });
    
    console.log('✅ Test document created:', testDoc.id);
    
    // Test 3: Clean up the test document
    await deleteDoc(doc(db, 'test-connection', testDoc.id));
    console.log('✅ Test document cleaned up');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection is working perfectly!',
      details: {
        testDocId: testDoc.id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code || 'UNKNOWN_ERROR'
      }
    }, { status: 500 });
  }
}





