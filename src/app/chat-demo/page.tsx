'use client';

import React from 'react';
import ChatWindowDemo from '../../components/ui/ChatWindowDemo';

export default function ChatDemoPage() {
  return (
    <div className="min-h-screen has-mesh-gradient">
      <div className="p-6">
        <div className="liquid-glass p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Chat Window Demo</h1>
          <p className="text-white/70">
            This is a demonstration of the ChatWindow component with the liquid glass design.
          </p>
        </div>
        
        <div className="liquid-glass p-6">
          <ChatWindowDemo />
        </div>
      </div>
    </div>
  );
} 