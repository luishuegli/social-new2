// Simple test script to verify poll creation
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChnUosKq-RZlWTnbcHZJ_r2_dg_GgIhwo",
  authDomain: "social-app-luis.firebaseapp.com",
  projectId: "social-app-luis",
  storageBucket: "social-app-luis.appspot.com",
  messagingSenderId: "871856044012",
  appId: "1:871856044012:web:e8c2426cc8a792089c9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testPollCreation() {
  try {
    console.log("Testing poll creation...");
    
    const testPoll = {
      title: "Test Poll",
      description: "Testing poll creation",
      options: [
        { id: "option_1", title: "Option 1", description: "First option", votes: 0, voters: [] },
        { id: "option_2", title: "Option 2", description: "Second option", votes: 0, voters: [] }
      ],
      groupId: "group-1",
      createdBy: "test-user",
      createdByName: "Test User",
      createdAt: serverTimestamp(),
      isActive: true,
      type: "ai_activity_suggestions",
      totalVotes: 0
    };

    const pollsCollection = collection(db, 'polls');
    const docRef = await addDoc(pollsCollection, testPoll);
    
    console.log("✅ Test poll created with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Error creating test poll:", error);
  }
}

testPollCreation();
