'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Check } from 'lucide-react';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext';
import LiquidGlass from '../ui/LiquidGlass';

// MemberAvatar component with error handling
function MemberAvatar({ member, index, totalMembers, size = "large" }) {
  const [imageError, setImageError] = React.useState(false);
  const isLarge = size === "large";
  const sizeClasses = isLarge ? "w-10 h-10" : "w-8 h-8";
  const imageSize = isLarge ? 40 : 24;
  const textSize = isLarge ? "text-sm" : "text-xs";

  return (
    <div
      className={`${sizeClasses} rounded-full border-2 border-background-primary overflow-hidden bg-background-secondary flex items-center justify-center`}
      style={{ zIndex: totalMembers - index }}
    >
      {member.avatarUrl && !imageError ? (
        <Image
          src={member.avatarUrl}
          alt={member.name}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`${textSize} font-semibold text-content-primary`}>
          {member.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

export default function GroupHeader({ group, onLeft }) {
  const { user } = useAuth();
  // Display the first 6 member avatars
  const displayMembers = group?.members?.slice(0, 6) || [];
  const remainingCount = (group?.members?.length || 0) - displayMembers.length;

  const handleJoinClick = async () => {
    if (!user || !group?.id) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      if (group.joined) {
        const confirmed = typeof window !== 'undefined' ? window.confirm('Leave this group? You will stop receiving updates.') : true;
        if (!confirmed) return;
        await updateDoc(groupRef, { members: arrayRemove(user.uid) });
        if (onLeft) onLeft();
      } else {
        await updateDoc(groupRef, { members: arrayUnion(user.uid) });
      }
    } catch (_) {
      // ignore – Firestore rules will enforce permissions
    }
  };

  if (!group) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <LiquidGlass className="p-6">
        {/* Group Name and Description */}
        <div className="mb-6">
          <h1 className="text-heading-1 font-bold text-content-primary mb-3">
            {group.name}
          </h1>
          <p className="text-content-secondary text-body leading-relaxed">
            {group.description}
          </p>
        </div>

        {/* Bottom Row: Members and Join Button */}
        <div className="flex items-center justify-between">
          {/* Member Avatars and Count */}
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-3">
              {displayMembers.map((member, index) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  index={index}
                  totalMembers={displayMembers.length}
                  size="large"
                />
              ))}
              {remainingCount > 0 && (
                <div className="w-10 h-10 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold text-content-primary">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-content-secondary" />
              <span className="text-content-secondary">
                {group.memberCount || group.members?.length || 0} member{(group.memberCount || group.members?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Join/Joined Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinClick}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
              group.joined
                ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            {group.joined ? (
              <>
                <Check className="w-4 h-4" />
                <span>Member</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Join Group</span>
              </>
            )}
          </motion.button>
        </div>
      </LiquidGlass>
    </motion.div>
  );
} 