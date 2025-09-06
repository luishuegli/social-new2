'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/app/Lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import UserProfileById from '@/app/profile/[userId]/page';

export default function UsernameProfileResolver() {
  const { username } = useParams();
  const router = useRouter();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const handle = String(username).toLowerCase();
      const q = query(collection(db, 'users'), where('usernameLower', '==', handle), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        router.replace('/');
      } else {
        setResolvedUserId(snap.docs[0].id);
      }
    };
    run();
  }, [username, router]);

  if (!resolvedUserId) return <div className="p-8 text-content-secondary">Loading…</div>;
  // Reuse existing profile page by rendering it directly with params via the component export
  // In Next App Router, we can navigate to the canonical profile page route or render a lightweight proxy
  return <UserProfileById />;
}


