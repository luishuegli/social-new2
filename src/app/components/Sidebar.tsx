'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { 
  Home, 
  Users, 
  MessageCircle, 
  LogOut,
  Plus,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { activeActivity } = useActivity();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: MessageCircle, label: 'Action Center', href: '/action-center', badge: 4 },
    { icon: Users, label: 'Groups', href: '/groups', badge: 7 },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Calendar, label: 'Activity Mode', href: '/activity-mode' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50 liquid-glass-square
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:fixed lg:translate-x-0
        w-64 min-w-64 max-w-64 border-r border-border-separator
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col h-full p-4 sm:p-6 min-w-0">
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
            <Link href={activeActivity ? '/posts/live/create' : '/posts/create'} className="block">
              <div className={`w-full flex items-center justify-center space-x-3 liquid-glass text-content-primary px-4 sm:px-6 py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 hover:bg-opacity-80 ${activeActivity ? 'ring-2 ring-green-400/60' : ''}`}>
                <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className="text-body truncate">New Post</span>
              </div>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <Link href={`/profile/${user.uid}`} className="block">
              <div className="liquid-glass p-4 sm:p-6 mt-4 sm:mt-6 flex-shrink-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary flex items-center justify-center rounded-full flex-shrink-0">
                    <span className="text-content-primary font-semibold text-body">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-content-primary truncate">
                      {user?.displayName || user?.email || 'User'}
                    </p>
                    <p className="text-caption text-content-secondary truncate">
                      {user?.email}
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
        </div>
      </div>
    </>
  );
} 