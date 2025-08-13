// src/app/api/test-firebase-permissions/route.js
import { db } from '../../Lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🧪 Testing Firebase permissions...');
    
    const results = {
      polls: { read: false, write: false },
      groups: { read: false, write: false },
      posts: { read: false, write: false },
      users: { read: false, write: false },
      ai_vote_history: { read: false, write: false },
      connections: { read: false, write: false },
      test: { read: false, write: false }
    };
    
    // Test reading from collections
    try {
      const pollsRef = collection(db, 'polls');
      const pollsSnapshot = await getDocs(pollsRef);
      results.polls.read = true;
      console.log('✅ Can read from polls collection');
    } catch (error) {
      console.error('❌ Cannot read from polls:', error.message);
    }
    
    try {
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      results.groups.read = true;
      console.log('✅ Can read from groups collection');
    } catch (error) {
      console.error('❌ Cannot read from groups:', error.message);
    }
    
    try {
      const postsRef = collection(db, 'posts');
      const postsSnapshot = await getDocs(postsRef);
      results.posts.read = true;
      console.log('✅ Can read from posts collection');
    } catch (error) {
      console.error('❌ Cannot read from posts:', error.message);
    }
    
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      results.users.read = true;
      console.log('✅ Can read from users collection');
    } catch (error) {
      console.error('❌ Cannot read from users:', error.message);
    }
    
    try {
      const voteHistoryRef = collection(db, 'ai_vote_history');
      const voteHistorySnapshot = await getDocs(voteHistoryRef);
      results.ai_vote_history.read = true;
      console.log('✅ Can read from ai_vote_history collection');
    } catch (error) {
      console.error('❌ Cannot read from ai_vote_history:', error.message);
    }
    try {
      const conRef = collection(db, 'connections');
      await getDocs(conRef);
      results.connections.read = true;
    } catch (e) {
      console.error('❌ Cannot read from connections:', e.message);
    }
    
    // Test writing to collections
    try {
      const testRef = collection(db, 'test');
      const testDoc = await addDoc(testRef, {
        message: 'Permission test',
        timestamp: serverTimestamp()
      });
      results.test.write = true;
      console.log('✅ Can write to test collection');
    } catch (error) {
      console.error('❌ Cannot write to test:', error.message);
    }
    
    try {
      const voteHistoryRef = collection(db, 'ai_vote_history');
      const voteDoc = await addDoc(voteHistoryRef, {
        pollId: 'test-poll',
        selectedOption: 'Test Activity',
        userId: 'test-user',
        groupId: 'test-group',
        timestamp: serverTimestamp(),
        type: 'ai_activity_vote'
      });
      results.ai_vote_history.write = true;
      console.log('✅ Can write to ai_vote_history collection');
    } catch (error) {
      console.error('❌ Cannot write to ai_vote_history:', error.message);
    }
    try {
      const conRef = collection(db, 'connections');
      await addDoc(conRef, { members: ['test', 'other'], createdAt: serverTimestamp() });
      results.connections.write = true;
    } catch (e) {
      console.error('❌ Cannot write to connections:', e.message);
    }
    
    console.log('📊 Permission test results:', results);
    
    return Response.json({ 
      success: true, 
      message: 'Firebase permissions test completed',
      results: results
    });
    
  } catch (error) {
    console.error('❌ Firebase permissions test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 