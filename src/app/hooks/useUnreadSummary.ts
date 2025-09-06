'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../Lib/firebase';

export interface UnreadSummary {
  totalUnread: number;
  groupsWithUnread: number;
  byGroup: Record<string, number>;
}

/**
 * Computes unread message counts per group for the given user.
 * Convention:
 * - Last read marker is stored at: groups/{groupId}/members/{userId}.lastReadAt
 * - If lastReadAt is missing, we treat it as 0 (all messages unread) until the first mark.
 */
export function useUnreadSummary(userId?: string | null): UnreadSummary {
  const [summary, setSummary] = useState<UnreadSummary>({ totalUnread: 0, groupsWithUnread: 0, byGroup: {} });
  const groupUnsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    // Cleanup any existing listeners
    Object.values(groupUnsubsRef.current).forEach((fn) => { try { fn(); } catch {} });
    groupUnsubsRef.current = {};

    if (!userId) {
      setSummary({ totalUnread: 0, groupsWithUnread: 0, byGroup: {} });
      return;
    }

    const groupsRef = collection(db, 'groups');
    const qGroups = query(groupsRef, where('members', 'array-contains', userId));

    const unsubGroups = onSnapshot(qGroups, (snap) => {
      // Stop listeners for groups that disappeared
      const existingIds = new Set<string>();
      snap.forEach((d) => existingIds.add(d.id));
      for (const [gid, unsub] of Object.entries(groupUnsubsRef.current)) {
        if (!existingIds.has(gid)) { try { unsub(); } catch {} delete groupUnsubsRef.current[gid]; }
      }

      const nextByGroup: Record<string, number> = {};
      let nextTotal = 0;
      let nextGroupsWithUnread = 0;

      snap.forEach((groupDoc) => {
        const groupId = groupDoc.id;

        // For each group, listen to lastReadAt and messages after that
        const memberDocRef = doc(db, 'groups', groupId, 'members', userId);
        const unsubMember = onSnapshot(memberDocRef, (memberSnap) => {
          const lastReadAt = (memberSnap.exists() ? (memberSnap.data() as any).lastReadAt : null) as Timestamp | null;
          const lastReadMs = lastReadAt?.toMillis?.() ?? 0;

          const messagesRef = collection(db, 'groups', groupId, 'messages');
          // We cannot do where(timestamp, '>', new Date(lastReadMs)) if lastReadMs==0 using serverTimestamp; handle both cases.
          const qMsgs = lastReadMs
            ? query(messagesRef, where('timestamp', '>', new Date(lastReadMs)))
            : query(messagesRef, orderBy('timestamp', 'desc'));

          // Tear down previous message listener for this group if any
          if (groupUnsubsRef.current[groupId]) { try { groupUnsubsRef.current[groupId]!(); } catch {} }

          const unsubMsgs = onSnapshot(qMsgs, (msgSnap) => {
            let count = 0;
            msgSnap.forEach((m) => {
              const ts: any = (m.data() as any).timestamp;
              const ms = ts?.toMillis?.() ? ts.toMillis() : (typeof ts === 'number' ? ts : 0);
              if (!lastReadMs || ms > lastReadMs) count += 1;
            });

            nextByGroup[groupId] = count;
            nextTotal = Object.values(nextByGroup).reduce((a, b) => a + b, 0);
            nextGroupsWithUnread = Object.values(nextByGroup).filter((c) => c > 0).length;
            setSummary({ totalUnread: nextTotal, groupsWithUnread: nextGroupsWithUnread, byGroup: { ...nextByGroup } });
          }, () => {
            nextByGroup[groupId] = 0;
            nextTotal = Object.values(nextByGroup).reduce((a, b) => a + b, 0);
            nextGroupsWithUnread = Object.values(nextByGroup).filter((c) => c > 0).length;
            setSummary({ totalUnread: nextTotal, groupsWithUnread: nextGroupsWithUnread, byGroup: { ...nextByGroup } });
          });

          groupUnsubsRef.current[groupId] = unsubMsgs;
        }, async () => {
          // If member doc missing, create baseline so we don't count all history forever on first run
          try { await setDoc(memberDocRef, { lastReadAt: serverTimestamp() }, { merge: true }); } catch {}
        });

        // Track also this member listener for cleanup
        groupUnsubsRef.current[groupId] = () => { try { unsubMember(); } catch {} };
      });
    });

    return () => {
      try { unsubGroups(); } catch {}
      Object.values(groupUnsubsRef.current).forEach((fn) => { try { fn(); } catch {} });
      groupUnsubsRef.current = {};
    };
  }, [userId]);

  return summary;
}

/**
 * Marks a group's messages as read now for the given user.
 */
export async function markGroupAsRead(groupId: string, userId: string) {
  try {
    await setDoc(doc(db, 'groups', groupId, 'members', userId), { lastReadAt: serverTimestamp() }, { merge: true });
  } catch {}
}


