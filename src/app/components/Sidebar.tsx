'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useCanPostLive } from '../hooks/useCanPostLive';
import { useUnreadSummary } from '../hooks/useUnreadSummary';
import { 
  Home, 
  Users, 
  MessageCircle, 
  LogOut,
  Plus,
  Calendar,
  MoreHorizontal,
  Palette,
  Cog
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { activeActivity } = useActivity();
  const { canPost } = useCanPostLive(activeActivity?.id);
  const pathname = usePathname();
  const unread = useUnreadSummary(user?.uid);
  const router = useRouter();
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

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const themeClasses = [
    'mesh-theme-gray-haze',
    'mesh-theme-midnight-neon',
    'mesh-theme-calm-ocean',
    'mesh-theme-refined-mono',
    'mesh-theme-warm-sunset',
  ];

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
    let maxHeightPx: number | undefined;
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
  }, [showSettings]);

  // Close when clicking outside the panel
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && moreBtnRef.current && !moreBtnRef.current.contains(e.target as Node)) {
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
      console.error('Failed to log out:', error);
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: MessageCircle, label: 'Action Center', href: '/action-center', badge: unread.totalUnread || undefined },
    { icon: Users, label: 'Groups', href: '/groups', badge: unread.groupsWithUnread || undefined },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Calendar, label: 'Live Activities', href: '/activity-mode' },
  ];

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
          <nav className="flex-1 space-y-2 sm:space-y-3 min-w-0">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 text-body font-semibold rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'liquid-glass text-content-primary' 
                      : 'text-content-secondary hover:bg-background-secondary'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <div className="liquid-glass-round text-content-primary text-xs font-bold w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {item.badge}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8 flex-shrink-0">
            <Link href={canPost ? '/posts/live/create' : '/posts/create'} className="block">
              <div className={`w-full flex items-center justify-center space-x-3 liquid-glass text-content-primary px-4 sm:px-6 py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 hover:bg-opacity-80 ${canPost ? 'border-2 border-green-500' : ''}`} style={canPost ? {
                animation: 'pulse-border 2s infinite',
                boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)'
              } : {}}>
                {canPost ? (
                  <>
                    <span className="text-body truncate">Live Post</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                    <span className="text-body truncate">New Post</span>
                  </>
                )}
              </div>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <Link href={`/profile/${user.uid}`} className="block">
              <div className="liquid-glass p-4 sm:p-6 mt-4 sm:mt-6 flex-shrink-0">
                <div className="flex items-center justify-center min-w-0">
                  <div className="w-12 h-12 bg-accent-primary flex items-center justify-center rounded-full flex-shrink-0 mr-3 overflow-hidden">
                    {user?.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt="Profile picture"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-content-primary font-semibold text-body">
                        {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="text-body font-semibold text-content-primary truncate">
                      {user?.displayName || 'User'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Logout */}
          <div className="mt-4 sm:mt-6 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 text-body font-semibold text-content-secondary rounded-lg transition-all duration-200 hover:bg-background-secondary"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">Logout</span>
            </button>
          </div>

          {/* More / Settings */}
          <div className="mt-3 sm:mt-4 flex-shrink-0">
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
              className="w-full flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 text-body font-semibold text-content-secondary rounded-lg transition-all duration-200 hover:bg-background-secondary"
            >
              <MoreHorizontal className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">More</span>
            </button>
          </div>

          {/* Settings Panel (fixed, portal to body) */}
          {showSettings && typeof window !== 'undefined' && createPortal(
            <>
              <div
                ref={panelRef}
                className={`w-[15rem] max-w-[calc(100vw-2rem)] liquid-glass p-3 sm:p-4 pt-4 rounded-2xl border border-white/10 ring-1 ring-white/10 shadow-xl ${settingsView === 'theme' ? 'overflow-visible' : 'overflow-visible'}`}
                style={panelPos ?? { position: 'fixed', left: 268, top: 200, zIndex: 2147483647 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* No header; compact menu */}
                {settingsView === 'theme' && (
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onMouseDown={() => setSettingsView('root')}
                      className="text-caption px-2 py-1 rounded-md hover:bg-background-secondary text-content-secondary"
                    >
                      Back
                    </button>
                  </div>
                )}

                {settingsView === 'root' && (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onMouseDown={() => {
                        setShowSettings(false);
                        router.push('/settings');
                      }}
                      className="flex items-center justify-between px-1 py-2 rounded-lg transition-colors text-content-primary font-semibold hover:bg-background-secondary"
                    >
                      <span className="flex items-center space-x-2">
                        <Cog className="w-4 h-4" />
                        <span className="truncate">Settings</span>
                      </span>
                    </button>
                    <button
                      onMouseDown={() => setSettingsView('theme')}
                      className="flex items-center justify-between px-1 py-2 rounded-lg transition-colors text-content-primary font-semibold hover:bg-background-secondary"
                    >
                      <span className="flex items-center space-x-2">
                        <Palette className="w-4 h-4" />
                        <span className="truncate">Change theme</span>
                      </span>
                    </button>
                  </div>
                )}

                {settingsView === 'theme' && (
                  <>
                    <div className="mb-2 text-caption text-content-secondary">Choose a theme</div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Default', value: '' },
                        { label: 'Gray Haze', value: 'mesh-theme-gray-haze' },
                        { label: 'Midnight Neon', value: 'mesh-theme-midnight-neon' },
                        { label: 'Calm Ocean', value: 'mesh-theme-calm-ocean' },
                        { label: 'Refined Monochrome', value: 'mesh-theme-refined-mono' },
                        { label: 'Warm Sunset', value: 'mesh-theme-warm-sunset' },
                      ].map((opt) => (
                        <button
                          key={opt.value || 'default'}
                          onMouseDown={() => {
                            setTheme(opt.value);
                            applyTheme(opt.value);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            theme === opt.value ? 'liquid-glass text-content-primary' : 'text-content-secondary hover:bg-background-secondary'
                          }`}
                        >
                          <span className="flex items-center space-x-2">
                            <Palette className="w-4 h-4" />
                            <span className="truncate">{opt.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </>
  );
} 