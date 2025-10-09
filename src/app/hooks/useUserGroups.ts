'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types/firestoreSchema';
import { getUserGroups } from '../services/dataService';

export function useUserGroups(userId?: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchGroups = async () => {
      try {
        const userGroups = await getUserGroups(targetUserId);
        setGroups(userGroups);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [targetUserId]);

  return { groups, loading };
}

