'use client';

import React from 'react';
import AppLayout from '../components/AppLayout';
import SettingsUsername from '../components/SettingsUsername';
import SettingsPrivacy from '../components/SettingsPrivacy';
import SettingsProfilePicture from '../components/SettingsProfilePicture';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <h1 className="text-heading-2 text-content-primary font-bold mb-6">Settings</h1>

        {!user && <div className="liquid-glass p-4 rounded-2xl">Sign in to manage settings.</div>}

        {user && (
          <div className="space-y-6">
            <SettingsProfilePicture />
            <SettingsUsername />
            <SettingsPrivacy />
            {/* Future settings sections: bio, notifications, privacy */}
          </div>
        )}
      </div>
    </AppLayout>
  );
}


