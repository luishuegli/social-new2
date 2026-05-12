'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Compass, Mail, LucideIcon } from 'lucide-react';

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}

interface NavigationMenuProps {
  items?: NavigationItem[];
  unread?: {
    totalUnread?: number;
    groupsWithUnread?: number;
  };
}

const defaultNavigationItems = (unread?: NavigationMenuProps['unread']): NavigationItem[] => [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Compass, label: 'Connect', href: '/compass' },
  { icon: Mail, label: 'Inbox', href: '/inbox', badge: unread?.totalUnread || undefined },
  { icon: Users, label: 'Groups', href: '/groups', badge: unread?.groupsWithUnread || undefined },
  { icon: Calendar, label: 'Activities', href: '/activities' },
];

export default function NavigationMenu({ items, unread }: NavigationMenuProps) {
  const pathname = usePathname();
  const navigationItems = items || defaultNavigationItems(unread);

  return (
    <nav className="flex-1 space-y-3 sm:space-y-4 min-w-0">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`
              flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5 text-lg font-semibold rounded-lg transition-all duration-200
              ${isActive 
                ? 'liquid-glass text-content-primary' 
                : 'text-content-secondary hover:bg-background-secondary'
              }
            `}
          >
            <div className="flex items-center space-x-4 sm:space-x-5 min-w-0 flex-1">
              <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <div className="liquid-glass-round text-content-primary text-sm font-bold w-7 h-7 flex items-center justify-center flex-shrink-0">
                {item.badge}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}


