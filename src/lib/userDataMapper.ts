/**
 * User Data Mapper - Standardizes user data across the app
 * 
 * Ensures consistent field names and data structure
 */

import { UserData } from './userData';

/**
 * Normalize user data from any source to standard format
 * 
 * Handles different field names:
 * - profilePictureUrl vs photoURL vs avatar
 * - displayName vs name
 * - username (may be missing)
 */
export function normalizeUserData(data: any): UserData | null {
  if (!data) return null;

  // Extract user ID
  const uid = data.uid || data.id || data.userId;
  if (!uid) return null;

  // Normalize profile picture (always use profilePictureUrl)
  const profilePictureUrl = 
    data.profilePictureUrl || 
    data.photoURL || 
    data.avatar || 
    data.avatarUrl || 
    null;

  // Normalize display name
  const displayName = 
    data.displayName || 
    data.name || 
    data.username || 
    data.email?.split('@')[0] || 
    'User';

  // Normalize username
  const username = 
    data.username || 
    data.email?.split('@')[0] || 
    `user${uid.slice(-4)}`;

  return {
    uid,
    displayName,
    username,
    profilePictureUrl,
    bio: data.bio || data.description || undefined,
    email: data.email || undefined,
  };
}

/**
 * Get profile picture URL from any user data object
 * Always returns profilePictureUrl format
 */
export function getProfilePictureUrl(data: any): string | null {
  if (!data) return null;
  
  return (
    data.profilePictureUrl || 
    data.photoURL || 
    data.avatar || 
    data.avatarUrl || 
    null
  );
}

/**
 * Get display name from any user data object
 */
export function getDisplayName(data: any): string {
  if (!data) return 'User';
  
  return (
    data.displayName || 
    data.name || 
    data.username || 
    data.email?.split('@')[0] || 
    'User'
  );
}

/**
 * Get username from any user data object
 */
export function getUsername(data: any): string {
  if (!data) return 'user';
  
  return (
    data.username || 
    data.email?.split('@')[0] || 
    `user${(data.uid || data.id || '').slice(-4)}`
  );
}


