'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useCanPostLive } from '../hooks/useCanPostLive';
import { useUnreadSummary } from '../hooks/useUnreadSummary';
import { logger } from '@/lib/logger';
import { Plus, MoreHorizontal } from 'lucide-react';
import NavigationMenu from './sidebar/NavigationMenu';
import UserProfileSection from './sidebar/UserProfileSection';
import SettingsPanel from './sidebar/SettingsPanel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const themeClasses = [
  'mesh-theme-gray-haze',
  'mesh-theme-midnight-neon',
  'mesh-theme-calm-ocean',
  'mesh-theme-refined-mono',
  'mesh-theme-warm-sunset',
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { activeActivity } = useActivity();
  const { canPost } = useCanPostLive(activeActivity?.id);
  const unread = useUnreadSummary(user?.uid);
  
  const [theme, setTheme] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsView, setSettingsView] = useState<'root' | 'theme'>('root');
  const [panelPos, setPanelPos] = useState<React.CSSProperties | null>(null);
  
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // Persist and apply background theme
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('bgTheme') || '') : '';
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  // Handle escape key to close settings
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  function applyTheme(val: string) {
    const body = document.body;
    themeClasses.forEach((c) => body.classList.remove(c));
    if (val) body.classList.add(val);
    if (typeof window !== 'undefined') localStorage.setItem('bgTheme', val);
  }

  function positionPanel(useMeasuredSize: boolean) {
    const rect = moreBtnRef.current?.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    const margin = 12;
    const estimatedHeight = settingsView === 'theme' ? 500 : 260;
    const panelWidth = Math.round((useMeasuredSize ? panelRef.current?.offsetWidth : 256) || 256);
    const panelHeight = Math.round((useMeasuredSize ? panelRef.current?.offsetHeight : estimatedHeight) || estimatedHeight);
    if (!rect) return;

    // Horizontal: snap to the sidebar right edge with a small gap
    const sidebarGap = 10;
    let left = sidebarRect ? Math.round(sidebarRect.width + sidebarGap) : Math.round(rect.left);
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));

    // Vertical: viewport-based above/below logic
    const spaceAbove = Math.max(0, rect.top - margin);
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - margin);
    let top: number;
    
    // Prefer above; if it doesn't fit, pin the panel so its bottom is within the viewport
    if (spaceAbove >= panelHeight) {
      top = Math.round(rect.top - margin - panelHeight);
    } else if (spaceAbove > spaceBelow) {
      // Not enough room above for full height, but still prefer moving up as much as possible
      top = Math.max(margin, rect.top - margin - panelHeight);
    } else {
      // Place below but keep the bottom inside the viewport
      top = Math.min(Math.round(rect.bottom + margin), window.innerHeight - panelHeight - margin);
    }

    // Bake the slight lift directly into top to avoid compounding transforms on repeat clicks
    top = Math.max(margin, top - 8);
    setPanelPos({ position: 'fixed', left, top, zIndex: 2147483647 });
  }

  function openSettings() {
    setSettingsView('root');
    if (showSettings) {
      positionPanel(true);
      return;
    }
    setShowSettings(true);
    // Initial placement using estimated size so it appears instantly near the button
    positionPanel(false);
  }

  // After opening, measure the panel and place it within the viewport, anchored to the More button
  useLayoutEffect(() => {
    if (!showSettings) return;
    positionPanel(true);
  }, [showSettings]);

  // Reposition when switching between root and theme views (heights differ)
  useEffect(() => {
    if (!showSettings) return;
    positionPanel(true);
  }, [settingsView]);

  // Keep anchored while scrolling/resizing
  useEffect(() => {
    if (!showSettings) return;
    const handler = () => positionPanel(true);
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [showSettings, settingsView]);

  // Close when clicking outside the panel
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && 
          moreBtnRef.current && !moreBtnRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showSettings]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Failed to log out', error, 'Sidebar');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[900] lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div ref={sidebarRef} id="app-sidebar" className={`
        fixed top-0 left-0 h-screen z-[1000] liquid-glass-square
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:fixed lg:translate-x-0
        w-64 min-w-64 max-w-64 border-r border-border-separator
        transition-transform duration-300 ease-in-out
        overflow-hidden
      `}>
        <div className="flex flex-col h-screen p-4 sm:p-6 min-w-0">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-content-primary font-bold text-2xl">S</span>
                  </div>
                  <h1 className="text-heading-1 font-bold text-content-primary">Social</h1>
                </div>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-content-secondary hover:bg-background-secondary rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <NavigationMenu unread={unread} />

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8 flex-shrink-0">
            <Link href={canPost ? '/posts/live/create' : '/posts/create'} className="block">
              <div 
                className={`w-full flex items-center justify-center space-x-4 liquid-glass text-content-primary px-5 sm:px-7 py-4 sm:py-5 text-lg font-semibold rounded-lg transition-all duration-200 hover:bg-opacity-80 ${
                  canPost ? 'border-2 border-green-500' : ''
                }`} 
                style={canPost ? {
                  animation: 'pulse-border 2s infinite',
                  boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)'
                } : {}}
              >
                {canPost ? (
                  <span className="truncate">Live Post</span>
                ) : (
                  <>
                    <Plus className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                    <span className="truncate">New Post</span>
                  </>
                )}
              </div>
            </Link>
          </div>

          {/* User Info */}
          <UserProfileSection user={user} />

          {/* More / Settings */}
          <div className="mt-4 sm:mt-6 flex-shrink-0">
            <button
              ref={moreBtnRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openSettings();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openSettings();
                }
              }}
              className={`
                w-full flex items-center space-x-4 sm:space-x-5 px-4 sm:px-5 py-4 sm:py-5 text-lg font-semibold rounded-lg transition-all duration-200
                ${showSettings 
                  ? 'liquid-glass text-content-primary' 
                  : 'text-content-secondary hover:bg-background-secondary'
                }
              `}
            >
              <MoreHorizontal className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">More</span>
            </button>
          </div>

          {/* Settings Panel (portal) */}
          <SettingsPanel
            isOpen={showSettings}
            position={panelPos}
            panelRef={panelRef}
            view={settingsView}
            theme={theme}
            onViewChange={setSettingsView}
            onThemeChange={handleThemeChange}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </>
  );
}