'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cog, Palette, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface SettingsPanelProps {
  isOpen: boolean;
  position: React.CSSProperties | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  view: 'root' | 'theme';
  theme: string;
  onViewChange: (view: 'root' | 'theme') => void;
  onThemeChange: (theme: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const themeOptions = [
  { label: 'Default', value: '' },
  { label: 'Gray Haze', value: 'mesh-theme-gray-haze' },
  { label: 'Midnight Neon', value: 'mesh-theme-midnight-neon' },
  { label: 'Calm Ocean', value: 'mesh-theme-calm-ocean' },
  { label: 'Refined Monochrome', value: 'mesh-theme-refined-mono' },
  { label: 'Warm Sunset', value: 'mesh-theme-warm-sunset' },
];

export default function SettingsPanel({
  isOpen,
  position,
  panelRef,
  view,
  theme,
  onViewChange,
  onThemeChange,
  onClose,
  onLogout
}: SettingsPanelProps) {
  const router = useRouter();

  if (!isOpen || typeof window === 'undefined') {
    return null;
  }

  const handleSettingsClick = () => {
    onClose();
    router.push('/settings');
  };

  const handleLogoutClick = async () => {
    onClose();
    try {
      await onLogout();
    } catch (error) {
      logger.error('Logout failed', error, 'SettingsPanel');
    }
  };

  return createPortal(
    <div
      ref={panelRef}
      className={`w-[15rem] max-w-[calc(100vw-2rem)] liquid-glass p-3 sm:p-4 pt-4 rounded-2xl border border-white/10 ring-1 ring-white/10 shadow-xl ${view === 'theme' ? 'overflow-visible' : 'overflow-visible'}`}
      style={position ?? { position: 'fixed', left: 268, top: 200, zIndex: 2147483647 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {view === 'theme' && (
        <div className="flex items-center justify-end mb-2">
          <button
            onMouseDown={() => onViewChange('root')}
            className="text-caption px-2 py-1 rounded-md hover:bg-background-secondary text-content-secondary"
          >
            Back
          </button>
        </div>
      )}

      {view === 'root' && (
        <div className="grid grid-cols-1 gap-3">
          <button
            onMouseDown={handleSettingsClick}
            className="flex items-center justify-between px-3 py-4 rounded-lg transition-colors text-content-primary font-semibold hover:bg-background-secondary"
          >
            <span className="flex items-center space-x-3">
              <Cog className="w-5 h-5" />
              <span className="truncate text-lg">Settings</span>
            </span>
          </button>
          <button
            onMouseDown={() => onViewChange('theme')}
            className="flex items-center justify-between px-3 py-4 rounded-lg transition-colors text-content-primary font-semibold hover:bg-background-secondary"
          >
            <span className="flex items-center space-x-3">
              <Palette className="w-5 h-5" />
              <span className="truncate text-lg">Change theme</span>
            </span>
          </button>
          <button
            onMouseDown={handleLogoutClick}
            className="flex items-center justify-between px-3 py-4 rounded-lg transition-colors text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <span className="flex items-center space-x-3">
              <LogOut className="w-5 h-5" />
              <span className="truncate text-lg">Logout</span>
            </span>
          </button>
        </div>
      )}

      {view === 'theme' && (
        <>
          <div className="mb-3 text-lg text-content-secondary">Choose a theme</div>
          <div className="grid grid-cols-1 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value || 'default'}
                onMouseDown={() => onThemeChange(opt.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${theme === opt.value ? 'liquid-glass text-content-primary' : 'text-content-secondary hover:bg-background-secondary'
                  }`}
              >
                <span className="flex items-center space-x-3">
                  <Palette className="w-5 h-5" />
                  <span className="truncate text-lg">{opt.label}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
