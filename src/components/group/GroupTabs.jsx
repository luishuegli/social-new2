'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Calendar, Image, Users } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function GroupTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'plan', label: 'Plan Activity', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: Image },
    { id: 'members', label: 'Members', icon: Users }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <LiquidGlass className="p-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white backdrop-blur-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </LiquidGlass>
    </motion.div>
  );
} 