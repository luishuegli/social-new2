'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';

/**
 * MembersModal
 * Renders a modal with a scrollable list of group members.
 * Styled to match the app's Liquid Glass aesthetic.
 */
export default function MembersModal({ isOpen, onClose, members = [] }) {
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg mx-4 liquid-glass p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-content-primary">Members</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-content-secondary mb-3">{members.length} total</p>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-b-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-background-secondary flex items-center justify-center flex-shrink-0">
                    {m.avatarUrl ? (
                      <Image src={m.avatarUrl} alt={m.name || 'Member'} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-content-primary">
                        {(m.name?.charAt(0) || '?').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-content-primary truncate">{m.name || 'Member'}</p>
                    {m.username && (
                      <p className="text-xs text-content-secondary truncate">@{m.username}</p>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="py-8 text-center text-content-secondary text-sm">No members yet</div>
              )}
            </div>
          </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}


