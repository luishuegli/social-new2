// src/app/api/test-components/route.js
import { db } from '../../Lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🧪 Testing component compatibility with new Firestore structure...');
    
    // Test 1: Create a poll (for Action Center)
    console.log('Test 1: Creating a test poll...');
    const pollData = {
      title: 'Test Poll for Action Center',
      description: 'This is a test poll to verify Action Center functionality',
      options: [
        { id: 'option_1', title: 'Option 1', description: 'First option', votes: 0, voters: [] },
        { id: 'option_2', title: 'Option 2', description: 'Second option', votes: 0, voters: [] }
      ],
      groupId: 'test-group-1',
      groupName: 'Test Group',
      createdBy: 'test-user-1',
      createdByName: 'Test User',
      createdAt: serverTimestamp(),
      expiresAt: null,
      isActive: true,
      type: 'test_poll',
      totalVotes: 0
    };
    
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, pollData);
    console.log('✅ Test poll created with ID:', pollDoc.id);
    
    // Test 2: Create a group with proper structure
    console.log('Test 2: Creating a test group...');
    const groupData = {
      groupName: 'Test Group for Components',
      description: 'This is a test group to verify group components work',
  profilePictureUrl: '',
      members: ['test-user-1', 'test-user-2'],
      createdAt: serverTimestamp(),
      isPinned: false
    };
    
    const groupsRef = collection(db, 'groups');
    const groupDoc = await addDoc(groupsRef, groupData);
    console.log('✅ Test group created with ID:', groupDoc.id);
    
    // Test 3: Create a post
    console.log('Test 3: Creating a test post...');
    const postData = {
      activityTitle: 'Test Post for Feed',
      authorId: 'test-user-1',
      groupId: groupDoc.id,
      authenticityType: 'Live Post',
      media: [],
      description: 'This is a test post to verify the feed works',
      timestamp: serverTimestamp()
    };
    
    const postsRef = collection(db, 'posts');
    const postDoc = await addDoc(postsRef, postData);
    console.log('✅ Test post created with ID:', postDoc.id);
    
    // Test 4: Create a user profile
    console.log('Test 4: Creating a test user profile...');
    const userData = {
      displayName: 'Test User',
      username: 'testuser',
      bio: 'This is a test user for component testing',
  profilePictureUrl: '',
      stats: {
        memberOfGroupCount: 1,
        activitiesPlannedCount: 0
      }
    };
    
    const usersRef = collection(db, 'users');
    const userDoc = await addDoc(usersRef, userData);
    console.log('✅ Test user profile created with ID:', userDoc.id);
    
    return Response.json({ 
      success: true, 
      message: 'Component compatibility test completed successfully!',
      results: {
        pollId: pollDoc.id,
        groupId: groupDoc.id,
        postId: postDoc.id,
        userId: userDoc.id
      }
    });
    
  } catch (error) {
    console.error('❌ Component test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 