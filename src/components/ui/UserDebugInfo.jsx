'use client';

import React from 'react';
import { useAuth } from '../../app/contexts/AuthContext';

export default function UserDebugInfo() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-xs">
        <div className="text-yellow-400 font-semibold">Auth Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-xs">
        <div className="text-red-400 font-semibold">Not Authenticated</div>
        <div className="text-red-300 mt-1">User ID: null</div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-xs">
      <div className="text-green-400 font-semibold">Authenticated</div>
      <div className="text-green-300 mt-1">User ID: {user.uid}</div>
      <div className="text-green-300">Email: {user.email}</div>
    </div>
  );
} 