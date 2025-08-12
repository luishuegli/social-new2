// src/lib/testNewStructure.ts
import { 
  createUserProfile, 
  createGroup, 
  createPost, 
  sendMessageToGroup 
} from './firestoreModels';

export async function testNewStructure() {
  try {
    console.log('🧪 Testing new Firestore structure...');
    
    // Test basic Firebase connection first
    const { db } = await import('../app/Lib/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    console.log('🔥 Testing basic Firebase write...');
    const testRef = collection(db, 'test');
    const testDoc = await addDoc(testRef, {
      message: 'Test document',
      timestamp: serverTimestamp()
    });
    console.log('✅ Basic Firebase write successful, created doc:', testDoc.id);
    
    // 1. Create test user
    console.log('Step 1: Creating test user...');
    const userId = await createUserProfile('test-user-1', {
      displayName: 'Test User',
      username: 'testuser',
      bio: 'This is a test user for the new structure',
  profilePictureUrl: ''
    });
    console.log('✅ User created with ID:', userId);
    
    // 2. Create test group
    console.log('Step 2: Creating test group...');
    const groupId = await createGroup({
      groupName: 'Mountain Adventurers',
      description: 'A group for outdoor enthusiasts and adventure seekers',
  profilePictureUrl: '',
      members: [userId]
    });
    console.log('✅ Group created with ID:', groupId);
    
    // 3. Create test post
    console.log('Step 3: Creating test post...');
    const postId = await createPost({
      activityTitle: 'Hiking Adventure',
      authorId: userId,
      groupId: groupId,
      authenticityType: 'Live Post',
      media: [],
      description: 'Amazing hike today with the Mountain Adventurers group!'
    });
    console.log('✅ Post created with ID:', postId);
    
    // 4. Send test message
    console.log('Step 4: Sending test message...');
    const messageId = await sendMessageToGroup(groupId, {
      senderId: userId,
      text: 'Great hike today everyone! Looking forward to the next adventure!'
    });
    console.log('✅ Message sent with ID:', messageId);
    
    console.log('🎉 All tests completed successfully!');
    console.log('📊 Results:');
    console.log('- Test Doc ID:', testDoc.id);
    console.log('- User ID:', userId);
    console.log('- Group ID:', groupId);
    console.log('- Post ID:', postId);
    console.log('- Message ID:', messageId);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message, error.code, error.stack);
    throw error; // Re-throw so the API route can catch it
  }
} 