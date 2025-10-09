'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function SoloActivityModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ title, date, time, description });
    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="liquid-glass p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-content-primary">Schedule a Solo Activity</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-background-secondary transition-colors">
            <X className="w-6 h-6 text-content-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-content-secondary mb-1">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-separator rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
              required
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="date" className="block text-sm font-medium text-content-secondary mb-1">Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-background-secondary border border-border-separator rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="time" className="block text-sm font-medium text-content-secondary mb-1">Time</label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-background-secondary border border-border-separator rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-content-secondary mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-background-secondary border border-border-separator rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-content-secondary rounded-md hover:bg-background-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold bg-accent-primary text-white rounded-md hover:bg-accent-secondary transition-colors">
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
