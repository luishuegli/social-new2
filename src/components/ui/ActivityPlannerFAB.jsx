'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Calendar, Users } from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import ActivityPlannerModal from './ActivityPlannerModal';

export default function ActivityPlannerFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Activity Planner Modal */}
      <ActivityPlannerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
} 