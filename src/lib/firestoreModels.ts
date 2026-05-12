// src/lib/firestoreModels.ts
import { db } from '../app/Lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';

// ===== NEW DATA MODELS =====

// User Profile (top-level 'users' collection)
export interface User {
  displayName: string;
  username: string;
  bio: string;
  profilePictureUrl: string;
  stats: {
    memberOfGroupCount: number;
    activitiesPlannedCount: number;
  };
}

// Group Profile (top-level 'groups' collection)
export interface Group {
  groupName: string;
  description: string;
  profilePictureUrl: string;
  members: string[]; // Array of user UIDs
}

// Feed Post (top-level 'posts' collection)
export interface Post {
  id?: string;
  authorId: string;
  groupId?: string;
  activityId?: string;
  
  // Content
  content: string; // Main text content
  activityTitle?: string; // Optional title if it's an activity
  
  // Media (Unified)
  media: { type: 'image' | 'video', url: string }[];
  imageUrl?: string; // Legacy support
  
  // Metadata
  authenticityType: 'Live Post' | 'Later Post';
  visibility?: 'public' | 'friends' | 'private';
  postType?: 'Collaborative' | 'Individual';
  
  // Metrics
  likes: number;
  comments: number;
  
  // Timestamps
  timestamp: any; // Firestore Timestamp or Date
  createdAt: any; // Firestore Timestamp or Date
}

// Direct Chat (top-level 'chats' collection)
export interface Chat {
  members: [string, string]; // An array with exactly two user UIDs
}

// Message (sub-collection in both groups and chats)
export interface Message {
  senderId: string; // user UID
  text: string;
  timestamp: Date;
}

// ===== CREATION FUNCTIONS =====

export async function createUserProfile(authUid: string, userData: Omit<User, 'stats'>) {
  try {
    console.log('👤 Creating user profile for:', authUid);
    
    const userProfile: User = {
      ...userData,
      stats: {
        memberOfGroupCount: 0,
        activitiesPlannedCount: 0
      }
    };

    const userRef = doc(db, 'users', authUid);
    await setDoc(userRef, userProfile);
    
    console.log('✅ User profile created successfully');
    return authUid;
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
}

export async function createGroup(groupData: Omit<Group, 'id'>) {
  try {
    console.log('👥 Creating group:', groupData.groupName);
    
    const groupsRef = collection(db, 'groups');
    const groupDoc = await addDoc(groupsRef, {
      ...groupData,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Group created successfully with ID:', groupDoc.id);
    return groupDoc.id;
  } catch (error) {
    console.error('❌ Error creating group:', error);
    throw error;
  }
}

export async function createPost(postData: Omit<Post, 'timestamp'>) {
  try {
    console.log('📝 Creating post:', postData.activityTitle);
    
    const postsRef = collection(db, 'posts');
    const postDoc = await addDoc(postsRef, {
      ...postData,
      timestamp: serverTimestamp()
    });
    
    console.log('✅ Post created successfully with ID:', postDoc.id);
    return postDoc.id;
  } catch (error) {
    console.error('❌ Error creating post:', error);
    throw error;
  }
}

export async function sendMessageToGroup(groupId: string, messageData: Omit<Message, 'timestamp'>) {
  try {
    console.log(' Sending message to group:', groupId);
    
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp()
    });
    
    console.log('✅ Group message sent successfully');
    return messageDoc.id;
  } catch (error) {
    console.error('❌ Error sending group message:', error);
    throw error;
  }
}

export async function startDirectChat(user1_uid: string, user2_uid: string) {
  try {
    console.log('💬 Starting direct chat between:', user1_uid, 'and', user2_uid);
    
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('members', 'array-contains', user1_uid)
    );
    const existingChats = await getDocs(q);
    
    const existingChat = existingChats.docs.find(doc => {
      const data = doc.data() as Chat;
      return data.members.includes(user2_uid);
    });
    
    if (existingChat) {
      console.log('✅ Direct chat already exists');
      return existingChat.id;
    }
    
    // Create new chat
    const chatData: Chat = {
      members: [user1_uid, user2_uid]
    };
    
    const chatDoc = await addDoc(chatsRef, chatData);
    console.log('✅ Direct chat created successfully with ID:', chatDoc.id);
    return chatDoc.id;
  } catch (error) {
    console.error('❌ Error starting direct chat:', error);
    throw error;
  }
}

export async function sendDirectMessage(chatId: string, messageData: Omit<Message, 'timestamp'>) {
  try {
    console.log('💬 Sending direct message to chat:', chatId);
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp()
    });
    
    console.log('✅ Direct message sent successfully');
    return messageDoc.id;
  } catch (error) {
    console.error('❌ Error sending direct message:', error);
    throw error;
  }
} 