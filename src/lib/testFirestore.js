// Test Firestore connection
import { db } from '../app/Lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function testFirestoreConnection() {
  try {
    console.log('🧪 Testing Firestore connection...');
    console.log('DB object:', db);
    
    const testDoc = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Test connection'
    };
    
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, testDoc);
    
    console.log('✅ Firestore test successful! Document ID:', docRef.id);
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return { success: false, error: error.message };
  }
}
