'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent min-w-[320px]">
      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 relative z-10">
        {/* Top Bar */}
        <header className="liquid-glass border-b border-border-separator lg:hidden flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-background-secondary text-content-secondary transition-colors rounded-lg"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
            <h1 className="text-heading-2 font-semibold text-content-primary truncate">Social</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-2 sm:p-3 lg:p-4 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 