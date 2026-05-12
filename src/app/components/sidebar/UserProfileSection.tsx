'use client';

import React from 'react';
import Link from 'next/link';

interface User {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  photoURL?: string | null;
}

interface UserProfileSectionProps {
  user: User | null;
}

export default function UserProfileSection({ user }: UserProfileSectionProps) {
  if (!user) {
    return null;
  }

  const profilePicture = user.profilePictureUrl || user.photoURL;
  const displayName = user.displayName || 'User';
  const firstLetter = (displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <Link href={`/profile/${user.uid}`} className="block">
      <div className="liquid-glass p-5 sm:p-7 mt-4 sm:mt-6 flex-shrink-0">
        <div className="flex items-center justify-center min-w-0">
          <div className="w-14 h-14 bg-accent-primary flex items-center justify-center rounded-full flex-shrink-0 mr-4 overflow-hidden">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile picture"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-content-primary font-semibold text-lg">
                {firstLetter}
              </span>
            )}
          </div>
          <div className="min-w-0 text-center">
            <p className="text-lg font-semibold text-content-primary truncate">
              {displayName}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}


