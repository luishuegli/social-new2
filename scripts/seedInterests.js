// scripts/seedInterests.js
// Script to seed the interests collection with initial data
// Run with: node scripts/seedInterests.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Use service account key (download from Firebase Console)
// const serviceAccount = require('../path-to-your-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   projectId: 'your-project-id'
// });

// Option 2: Use environment variables (recommended)
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (clientEmail && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  });
} else {
  // Fall back to Application Default Credentials
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  });
}

const db = admin.firestore();

const interests = [
  // Sports & Fitness
  { id: 'golf', displayName: 'Golf', type: 'in-person', category: 'Sports' },
  { id: 'tennis', displayName: 'Tennis', type: 'in-person', category: 'Sports' },
  { id: 'basketball', displayName: 'Basketball', type: 'in-person', category: 'Sports' },
  { id: 'soccer', displayName: 'Soccer', type: 'in-person', category: 'Sports' },
  { id: 'baseball', displayName: 'Baseball', type: 'in-person', category: 'Sports' },
  { id: 'football', displayName: 'Football', type: 'in-person', category: 'Sports' },
  { id: 'volleyball', displayName: 'Volleyball', type: 'in-person', category: 'Sports' },
  { id: 'swimming', displayName: 'Swimming', type: 'in-person', category: 'Sports' },
  { id: 'running', displayName: 'Running', type: 'in-person', category: 'Sports' },
  { id: 'cycling', displayName: 'Cycling', type: 'in-person', category: 'Sports' },
  { id: 'yoga', displayName: 'Yoga', type: 'in-person', category: 'Sports' },
  { id: 'gym', displayName: 'Gym & Fitness', type: 'in-person', category: 'Sports' },
  { id: 'martial-arts', displayName: 'Martial Arts', type: 'in-person', category: 'Sports' },
  
  // Outdoor Activities
  { id: 'hiking', displayName: 'Hiking', type: 'in-person', category: 'Outdoor' },
  { id: 'camping', displayName: 'Camping', type: 'in-person', category: 'Outdoor' },
  { id: 'climbing', displayName: 'Rock Climbing', type: 'in-person', category: 'Outdoor' },
  { id: 'skiing', displayName: 'Skiing', type: 'in-person', category: 'Outdoor' },
  { id: 'surfing', displayName: 'Surfing', type: 'in-person', category: 'Outdoor' },
  { id: 'fishing', displayName: 'Fishing', type: 'in-person', category: 'Outdoor' },
  { id: 'kayaking', displayName: 'Kayaking', type: 'in-person', category: 'Outdoor' },
  
  // Gaming
  { id: 'valorant', displayName: 'Valorant', type: 'online', category: 'Gaming' },
  { id: 'leagueoflegends', displayName: 'League of Legends', type: 'online', category: 'Gaming' },
  { id: 'overwatch', displayName: 'Overwatch', type: 'online', category: 'Gaming' },
  { id: 'minecraft', displayName: 'Minecraft', type: 'online', category: 'Gaming' },
  { id: 'fortnite', displayName: 'Fortnite', type: 'online', category: 'Gaming' },
  { id: 'csgo', displayName: 'CS:GO', type: 'online', category: 'Gaming' },
  { id: 'apex', displayName: 'Apex Legends', type: 'online', category: 'Gaming' },
  { id: 'chess', displayName: 'Chess', type: 'online', category: 'Gaming' },
  { id: 'boardgames', displayName: 'Board Games', type: 'in-person', category: 'Gaming' },
  { id: 'dnd', displayName: 'D&D', type: 'in-person', category: 'Gaming' },
  
  // Food & Drink
  { id: 'cooking', displayName: 'Cooking', type: 'in-person', category: 'Food' },
  { id: 'baking', displayName: 'Baking', type: 'in-person', category: 'Food' },
  { id: 'coffee', displayName: 'Coffee', type: 'in-person', category: 'Food' },
  { id: 'wine', displayName: 'Wine Tasting', type: 'in-person', category: 'Food' },
  { id: 'craft-beer', displayName: 'Craft Beer', type: 'in-person', category: 'Food' },
  { id: 'cocktails', displayName: 'Cocktails', type: 'in-person', category: 'Food' },
  { id: 'foodie', displayName: 'Foodie Adventures', type: 'in-person', category: 'Food' },
  
  // Arts & Culture
  { id: 'reading', displayName: 'Reading', type: 'online', category: 'Arts' },
  { id: 'writing', displayName: 'Writing', type: 'online', category: 'Arts' },
  { id: 'poetry', displayName: 'Poetry', type: 'online', category: 'Arts' },
  { id: 'photography', displayName: 'Photography', type: 'in-person', category: 'Arts' },
  { id: 'painting', displayName: 'Painting', type: 'in-person', category: 'Arts' },
  { id: 'drawing', displayName: 'Drawing', type: 'in-person', category: 'Arts' },
  { id: 'music', displayName: 'Music', type: 'in-person', category: 'Arts' },
  { id: 'guitar', displayName: 'Guitar', type: 'in-person', category: 'Arts' },
  { id: 'piano', displayName: 'Piano', type: 'in-person', category: 'Arts' },
  { id: 'singing', displayName: 'Singing', type: 'in-person', category: 'Arts' },
  
  // Entertainment
  { id: 'movies', displayName: 'Movies', type: 'in-person', category: 'Entertainment' },
  { id: 'anime', displayName: 'Anime', type: 'online', category: 'Entertainment' },
  { id: 'tv-shows', displayName: 'TV Shows', type: 'online', category: 'Entertainment' },
  { id: 'documentaries', displayName: 'Documentaries', type: 'online', category: 'Entertainment' },
  { id: 'comedy', displayName: 'Comedy Shows', type: 'in-person', category: 'Entertainment' },
  { id: 'concerts', displayName: 'Concerts', type: 'in-person', category: 'Entertainment' },
  { id: 'theater', displayName: 'Theater', type: 'in-person', category: 'Entertainment' },
  
  // Tech & Innovation
  { id: 'coding', displayName: 'Coding', type: 'online', category: 'Tech' },
  { id: 'ai', displayName: 'AI & Machine Learning', type: 'online', category: 'Tech' },
  { id: 'blockchain', displayName: 'Blockchain', type: 'online', category: 'Tech' },
  { id: 'startups', displayName: 'Startups', type: 'in-person', category: 'Tech' },
  { id: 'investing', displayName: 'Investing', type: 'online', category: 'Tech' },
  { id: 'crypto', displayName: 'Cryptocurrency', type: 'online', category: 'Tech' },
  { id: 'web3', displayName: 'Web3', type: 'online', category: 'Tech' },
  
  // Social & Community
  { id: 'travel', displayName: 'Travel', type: 'in-person', category: 'Social' },
  { id: 'languages', displayName: 'Language Learning', type: 'online', category: 'Social' },
  { id: 'culture', displayName: 'Cultural Exchange', type: 'in-person', category: 'Social' },
  { id: 'volunteering', displayName: 'Volunteering', type: 'in-person', category: 'Social' },
  { id: 'activism', displayName: 'Activism', type: 'in-person', category: 'Social' },
  { id: 'networking', displayName: 'Professional Networking', type: 'in-person', category: 'Social' },
  
  // Wellness
  { id: 'meditation', displayName: 'Meditation', type: 'in-person', category: 'Wellness' },
  { id: 'mindfulness', displayName: 'Mindfulness', type: 'in-person', category: 'Wellness' },
  { id: 'spirituality', displayName: 'Spirituality', type: 'in-person', category: 'Wellness' },
  { id: 'wellness', displayName: 'Wellness & Self-care', type: 'in-person', category: 'Wellness' },
  
  // Fashion & Style
  { id: 'fashion', displayName: 'Fashion', type: 'in-person', category: 'Fashion' },
  { id: 'streetwear', displayName: 'Streetwear', type: 'in-person', category: 'Fashion' },
  { id: 'vintage', displayName: 'Vintage Fashion', type: 'in-person', category: 'Fashion' },
  { id: 'thrifting', displayName: 'Thrifting', type: 'in-person', category: 'Fashion' },
  { id: 'sneakers', displayName: 'Sneakers', type: 'in-person', category: 'Fashion' },
  
  // Dance
  { id: 'dancing', displayName: 'Dancing', type: 'in-person', category: 'Dance' },
  { id: 'salsa', displayName: 'Salsa Dancing', type: 'in-person', category: 'Dance' },
  { id: 'hip-hop', displayName: 'Hip-Hop Dance', type: 'in-person', category: 'Dance' },
  { id: 'ballet', displayName: 'Ballet', type: 'in-person', category: 'Dance' },
  { id: 'contemporary', displayName: 'Contemporary Dance', type: 'in-person', category: 'Dance' }
];

async function seedInterests() {
  console.log('🌱 Starting to seed interests collection...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const interest of interests) {
    const docRef = db.collection('interests').doc(interest.id);
    batch.set(docRef, {
      displayName: interest.displayName,
      type: interest.type,
      category: interest.category
    });
    count++;
  }
  
  try {
    await batch.commit();
    console.log(`✅ Successfully seeded ${count} interests!`);
  } catch (error) {
    console.error('❌ Error seeding interests:', error);
  } finally {
    process.exit();
  }
}

seedInterests();
