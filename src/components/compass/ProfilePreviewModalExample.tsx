'use client';

/**
 * ProfilePreviewModalExample.tsx
 * 
 * This is an example component showing how to integrate the ProfilePreviewModal
 * into different parts of your application (e.g., user search, group members, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserProfile } from '@/app/types/firestoreSchema';
import ProfilePreviewModal from './ProfilePreviewModal';
import { UserPlus, Search } from 'lucide-react';

export default function ProfilePreviewModalExample() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<Partial<UserProfile>[]>([]);
  const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock user data - replace with actual API call
  useEffect(() => {
    // Example: Fetch users from your API
    const mockUsers: Partial<UserProfile>[] = [
      {
        uid: 'user1',
        username: 'johndoe',
        displayName: 'John Doe',
        photoURL: 'https://via.placeholder.com/150',
        bio: 'Coffee enthusiast and avid hiker',
        dna: {
          archetype: 'explorer',
          coreInterests: [
            { tag: '#coffee', passion: 'passionate', type: 'in-person' },
            { tag: '#hiking', passion: 'passionate', type: 'in-person' },
          ],
          connectionIntent: 'both',
          socialTempo: 'small-group',
          languages: ['en'],
        },
      },
      {
        uid: 'user2',
        username: 'janesmith',
        displayName: 'Jane Smith',
        photoURL: 'https://via.placeholder.com/150',
        bio: 'Creative designer who loves art and music',
        dna: {
          archetype: 'creator',
          coreInterests: [
            { tag: '#design', passion: 'pro', type: 'online' },
            { tag: '#music', passion: 'passionate', type: 'in-person' },
          ],
          connectionIntent: 'planned',
          socialTempo: 'one-on-one',
          languages: ['en', 'es'],
        },
      },
    ];
    
    setUsers(mockUsers);
  }, []);

  // Handle connection request
  const handleConnect = async (userId: string, message?: string) => {
    if (!firebaseUser) {
      alert('Please sign in to connect with users');
      return;
    }

    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: userId,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.mutualMatch) {
          alert('🎉 Mutual match! You are now connected!');
        } else {
          alert('✅ Connection request sent successfully!');
        }
        setSelectedUser(null);
      } else {
        if (data.alreadyExists) {
          alert('⚠️ You have already sent a connection request to this user');
        } else if (data.alreadyConnected) {
          alert('ℹ️ You are already connected with this user');
        } else {
          alert(`❌ Error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle view profile
  const handleViewProfile = (user: Partial<UserProfile>) => {
    setSelectedUser(user);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content-primary mb-2">
            Discover People
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Click on a user to view their profile and send a connection request
          </p>
        </div>

        {/* Search Bar (Optional) */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 liquid-glass text-content-primary placeholder-gray-500 focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <div
              key={user.uid}
              onClick={() => handleViewProfile(user)}
              className="liquid-glass rounded-xl p-6 border border-gray-200/20 dark:border-gray-700/20 hover:border-accent-primary/50 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-content-primary truncate">
                    {user.displayName || user.username}
                  </h3>
                  {user.displayName && user.username && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{user.username}
                    </p>
                  )}
                  {user.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  
                  {/* Interests Preview */}
                  {user.dna?.coreInterests && user.dna.coreInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.dna.coreInterests.slice(0, 3).map((interest) => (
                        <span
                          key={interest.tag}
                          className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {interest.tag.replace('#', '')}
                        </span>
                      ))}
                      {user.dna.coreInterests.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500">
                          +{user.dna.coreInterests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Connect Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProfile(user);
                  }}
                  className="flex-shrink-0 p-2 rounded-lg liquid-glass hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Connect"
                >
                  <UserPlus className="w-5 h-5 text-accent-primary" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}

        {/* Profile Preview Modal */}
        {selectedUser && (
          <ProfilePreviewModal
            user={selectedUser}
            matchScore={Math.floor(Math.random() * 30) + 70} // Mock score
            sharedInterests={selectedUser.dna?.coreInterests || []}
            onClose={() => setSelectedUser(null)}
            onConnect={handleConnect}
          />
        )}
      </div>
    </div>
  );
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Import this example component or ProfilePreviewModal directly
 * 2. Replace mock user data with actual API calls
 * 3. Customize the user card design as needed
 * 4. Add to your routes (e.g., /discover, /search, /members)
 * 
 * INTEGRATION EXAMPLES:
 * 
 * A. In a Group Members List:
 *    - Show all group members
 *    - Click to view profile and connect
 * 
 * B. In a Search Page:
 *    - Search for users by interests/location
 *    - Preview and connect with matching users
 * 
 * C. In Activity Participants:
 *    - Show who's attending an activity
 *    - Connect with other participants
 * 
 * D. In Mutual Friends:
 *    - Show friends of friends
 *    - Expand your network
 */

