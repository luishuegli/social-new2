'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Check, Calendar, MapPin, Plus } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';
import MembersModal from '../ui/MembersModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { arrayUnion, arrayRemove, doc, serverTimestamp, setDoc, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';

export default function GroupInspector({ group, onPlanActivity }) {
  const { user } = useAuth();
  const [plannedActivities, setPlannedActivities] = React.useState([]);
  const [nextActivityLive, setNextActivityLive] = React.useState(null);
  const [busyActivityId, setBusyActivityId] = React.useState(null);
  const [isMembersOpen, setIsMembersOpen] = React.useState(false);

  if (!group) {
    return null;
  }

  // Display the first 6 member avatars
  const displayMembers = group.members?.slice(0, 6) || [];
  const remainingCount = (group.members?.length || 0) - displayMembers.length;

  const handleJoinClick = async () => {
    if (!user || !group?.id) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, { members: arrayUnion(user.uid) });
      await setDoc(doc(db, 'groups', group.id, 'members', user.uid), { joinedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      // no-op; rules will enforce permissions
    }
  };

  // Listen to planned activities for this group
  React.useEffect(() => {
    if (!group?.id) return;
    const ref = collection(db, 'activities');
    const unsub = onSnapshot(ref, (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.groupId === group.id && data.status === 'planned') {
          items.push({ id: d.id, ...data });
        }
      });
      setPlannedActivities(items);
    });
    return () => unsub();
  }, [group?.id]);

  // Live-sync the "Up Next" activity by id from activities collection (for participants)
  React.useEffect(() => {
    if (!group?.nextActivity?.id) {
      setNextActivityLive(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'activities', group.nextActivity.id), (snap) => {
      if (snap.exists()) setNextActivityLive({ id: snap.id, ...snap.data() });
    }, () => setNextActivityLive(null));
    return () => unsub();
  }, [group?.nextActivity?.id]);

  // Toggle RSVP helper with optimistic UI for the Up Next card
  const toggleUpNextRsvp = async (isJoined) => {
    if (!user?.uid || !group?.nextActivity?.id) return;
    const activityId = group.nextActivity.id;
    const currentParticipants = (nextActivityLive?.participants || group.nextActivity.participants) || [];
    const optimisticParticipants = isJoined
      ? currentParticipants.filter((pid) => pid !== user.uid)
      : [...currentParticipants, user.uid];

    // Optimistic update
    setBusyActivityId(activityId);
    setNextActivityLive({ ...(nextActivityLive || { id: activityId }), participants: optimisticParticipants });

    try {
      await updateDoc(doc(db, 'activities', activityId), {
        participants: isJoined ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (e) {
      // Revert on failure
      setNextActivityLive({ ...(nextActivityLive || { id: activityId }), participants: currentParticipants });
    } finally {
      setBusyActivityId(null);
    }
  };

  // Toggle RSVP in the Planned Activities list with optimistic UI
  const togglePlannedRsvp = async (activity, isJoined) => {
    if (!user?.uid || !activity?.id) return;
    const activityId = activity.id;
    const currentParticipants = activity.participants || [];
    const optimisticParticipants = isJoined
      ? currentParticipants.filter((pid) => pid !== user.uid)
      : [...currentParticipants, user.uid];

    // Optimistic update
    setBusyActivityId(activityId);
    setPlannedActivities((prev) => prev.map((a) => a.id === activityId ? { ...a, participants: optimisticParticipants } : a));

    try {
      await updateDoc(doc(db, 'activities', activityId), {
        participants: isJoined ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (e) {
      // Revert on failure
      setPlannedActivities((prev) => prev.map((a) => a.id === activityId ? { ...a, participants: currentParticipants } : a));
    } finally {
      setBusyActivityId(null);
    }
  };

  return (
    <>
      <div className="sticky top-6">
        <div className="flex flex-col gap-6">
          {/* GroupHeader Module */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <LiquidGlass className="p-6">
              {/* Group Name and Description */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-content-primary mb-2">
                  {group.name}
                </h1>
                <p className="text-content-secondary text-sm leading-relaxed">
                  {group.description}
                </p>
              </div>

              {/* Member Avatars and Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="flex -space-x-2"
                    aria-label="View members"
                  >
                    {displayMembers.map((member, index) => (
                      <div
                        key={member?.id ? String(member.id) : `member-${index}`}
                        className="w-8 h-8 rounded-full border-2 border-background-primary overflow-hidden bg-background-secondary flex items-center justify-center"
                        style={{ zIndex: displayMembers.length - index }}
                      >
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-content-primary">
                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-background-primary bg-content-secondary flex items-center justify-center">
                        <span className="text-xs font-semibold text-content-primary">
                          +{remainingCount}
                        </span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMembersOpen(true); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                    aria-label="View members"
                  >
                    <Users className="w-4 h-4 text-content-secondary" />
                    <span className="text-xs text-content-secondary">
                      {group.memberCount || group.members?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Join/Joined Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoinClick}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center space-x-1 ${
                    group.joined
                      ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {group.joined ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Member</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      <span>Join</span>
                    </>
                  )}
                </motion.button>
              </div>
            </LiquidGlass>
          </motion.div>

          {/* UpNextActivity Module */}
          {group.nextActivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <LiquidGlass className="p-6">
                <h2 className="text-lg font-bold text-content-primary mb-3">Up Next</h2>
                
                <div className="space-y-3">
                  {/* Activity Title */}
                  <h3 className="text-sm font-semibold text-content-primary">
                    {group.nextActivity.title}
                  </h3>

                  {/* Activity Details */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-content-secondary" />
                      <span className="text-xs text-content-secondary">
                        {new Date(group.nextActivity.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>

                    {group.nextActivity.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-content-secondary" />
                        <span className="text-xs text-content-secondary truncate">
                          {group.nextActivity.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Who's coming (participants) */}
                  {Array.isArray((nextActivityLive?.participants || group.nextActivity.participants)) && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex -space-x-2">
                        {(nextActivityLive?.participants || group.nextActivity.participants).slice(0,6).map((pid, idx) => (
                          <div key={pid+idx} className="w-7 h-7 rounded-full bg-background-secondary border-2 border-background-primary flex items-center justify-center text-[10px] text-content-primary">{pid.slice(0,2).toUpperCase()}</div>
                        ))}
                        {(nextActivityLive?.participants || group.nextActivity.participants).length > 6 && (
                          <div className="w-7 h-7 rounded-full bg-content-secondary border-2 border-background-primary flex items-center justify-center text-[10px] text-content-primary">+{(nextActivityLive?.participants || group.nextActivity.participants).length - 6}</div>
                        )}
                      </div>
                      {user?.uid && (
                        ((nextActivityLive?.participants || group.nextActivity.participants).includes(user.uid)) ? (
                          <button
                            onClick={() => toggleUpNextRsvp(true)}
                            disabled={busyActivityId === group.nextActivity.id}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm disabled:opacity-50"
                          >
                            Cancel RSVP
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleUpNextRsvp(false)}
                            disabled={busyActivityId === group.nextActivity.id}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm disabled:opacity-50"
                          >
                            RSVP
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </LiquidGlass>
            </motion.div>
          )}

          {/* Planned Activities (RSVP) */}
          {plannedActivities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.12 }}
            >
              <LiquidGlass className="p-6">
                <h2 className="text-lg font-bold text-content-primary mb-3">Planned Activities</h2>
                <div className="space-y-3">
                  {plannedActivities.map((a) => {
                    const joined = (a.participants || []).includes(user?.uid);
                    return (
                      <div key={a.id} className="flex items-center justify-between border border-border-separator rounded-lg p-3">
                        <div>
                          <div className="text-content-primary font-semibold">{a.title}</div>
                          <div className="text-content-secondary text-sm">{a.location || ''}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {(a.participants || []).slice(0,5).map((pid, idx) => (
                              <div key={pid+idx} className="w-7 h-7 rounded-full bg-background-secondary border-2 border-background-primary flex items-center justify-center text-[10px] text-content-primary">{pid.slice(0,2).toUpperCase()}</div>
                            ))}
                          </div>
                          {joined ? (
                            <button
                              onClick={() => togglePlannedRsvp(a, true)}
                              disabled={busyActivityId === a.id}
                              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm disabled:opacity-50"
                            >
                              Cancel RSVP
                            </button>
                          ) : (
                            <button
                              onClick={() => togglePlannedRsvp(a, false)}
                              disabled={busyActivityId === a.id}
                              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm disabled:opacity-50"
                            >
                              Join Activity
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LiquidGlass>
            </motion.div>
          )}

          {/* PlanActivityButton - Now wrapped in LiquidGlass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <LiquidGlass className="p-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPlanActivity}
                className="w-full px-6 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 backdrop-blur-sm transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Plan New Activity</span>
              </motion.button>
            </LiquidGlass>
          </motion.div>
        </div>
      </div>
      {/* Members Modal */}
      <MembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={group.members || []}
      />
    </>
  );
} 