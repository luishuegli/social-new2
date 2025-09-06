'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../Lib/firebase';

export default function ActivityModePage() {
  const { user } = useAuth();
  const { startActivity, activeActivity } = useActivity();
  const [planned, setPlanned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ref = collection(db, 'activities');
        // Show activities where user is a participant and status is planned
        const snap = await getDocs(ref);
        const items: any[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if ((data.status === 'planned' || data.status === 'active') && (data.participants || []).includes(user?.uid)) {
            items.push({ id: d.id, ...data });
          }
        });
        setPlanned(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="liquid-glass p-4 sm:p-6 lg:p-8 mb-6">
          <h1 className="text-heading-1 font-bold text-content-primary">Activity Mode</h1>
          <p className="text-content-secondary">Start a planned activity to enable Feed.</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="liquid-glass p-4">Loading…</div>
          ) : planned.length === 0 ? (
            <div className="liquid-glass p-4">No planned activities. Create one from your group.</div>
          ) : (
            planned.map((a) => (
              <div key={a.id} className="liquid-glass p-4 flex items-center justify-between">
                <div>
                  <div className="text-content-primary font-semibold">{a.title}</div>
                  <div className="text-content-secondary text-sm">Status: {a.status}</div>
                </div>
                {activeActivity?.id === a.id ? (
                  <span className="px-3 py-2 text-sm rounded-card bg-green-600 text-white">Active</span>
                ) : (
                  <button
                    onClick={() => startActivity(a.id)}
                    className="px-3 py-2 text-sm font-semibold rounded-card bg-accent-primary text-content-primary hover:bg-opacity-80"
                  >
                    Start Activity Mode
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

