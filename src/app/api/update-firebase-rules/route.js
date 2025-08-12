import { NextResponse } from 'next/server';

export async function GET() {
  // Production-ready Firestore security rules as specified in the blueprint
  const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is a group member
    function isGroupMember(groupId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/friends/$(userId)));
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if isAuthenticated() && isGroupMember(groupId);
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && isGroupMember(groupId);
      
      // Group members subcollection
      match /members/{memberId} {
        allow read, write: if isAuthenticated() && isGroupMember(groupId);
      }
      
      // Group messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() && isGroupMember(groupId);
        allow create: if isAuthenticated() && isGroupMember(groupId);
        allow update, delete: if isAuthenticated() && isGroupMember(groupId) && 
          resource.data.senderId == request.auth.uid;
      }
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
        request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
        resource.data.authorId == request.auth.uid;
    }
    
    // Polls collection
    match /polls/{pollId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated() && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Activity suggestions collection (for AI recommendations)
    match /activitySuggestions/{suggestionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
    
    // Vote history collection (for AI learning)
    match /voteHistory/{voteId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
  }
}
`;

  return NextResponse.json({
    success: true,
    rules: securityRules,
    message: 'Production-ready Firestore security rules',
    instructions: [
      '1. Copy these rules to your Firebase Console',
      '2. Go to Firestore Database > Rules',
      '3. Replace existing rules with the above',
      '4. Click "Publish" to deploy'
    ]
  });
} 