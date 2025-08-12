'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import LiquidGlass from '../ui/LiquidGlass';

export default function ManualPollCreator({ onClose, groupId = 'group-6' }) {
  const [pollData, setPollData] = useState({
    title: '',
    description: '',
    options: [
      { id: 1, title: '', description: '', imageUrl: '', imageFile: null }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);

  const addOption = () => {
    const newId = pollData.options.length + 1;
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, title: '', description: '', imageUrl: '', imageFile: null }]
    }));
  };

  const removeOption = (id) => {
    if (pollData.options.length > 1) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter(option => option.id !== id)
      }));
    }
  };

  const updateOption = (id, field, value) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === id ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleImageUpload = (id, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateOption(id, 'imageUrl', e.target.result);
        updateOption(id, 'imageFile', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!pollData.title.trim()) {
      alert('Please enter a poll title');
      return;
    }

    if (pollData.options.some(option => !option.title.trim())) {
      alert('Please fill in all option titles');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📊 Creating manual poll:', pollData);
      
      // Call the Cloud Function
      const response = await fetch('/api/planActivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow: 'manualPoll',
          title: pollData.title,
          description: pollData.description,
          options: pollData.options.map(option => ({
            title: option.title,
            description: option.description,
            imageUrl: option.imageUrl
          })),
          groupId: groupId,
          userId: 'current-user', // TODO: Get from auth context
          userName: 'Current User' // TODO: Get from auth context
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create poll');
      }

      console.log('✅ Manual poll created:', result);
      
      // Show success message before closing
      alert(`🎉 Awesome! Your custom poll "${pollData.title}" has been created!\n\nIt's now available in your group chat with ${pollData.options.length} options for everyone to vote on.`);
      
      onClose();
    } catch (error) {
      console.error('❌ Error creating manual poll:', error);
      alert(`Failed to create poll: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Create Custom Poll</h3>
        <p className="text-white/70">Design your own activity poll with images and descriptions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poll Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Poll Title
          </label>
          <input
            type="text"
            value={pollData.title}
            onChange={(e) => setPollData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="What should we do next?"
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            required
          />
        </div>

        {/* Poll Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Poll Description
          </label>
          <textarea
            value={pollData.description}
            onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what you're planning or any specific requirements..."
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Poll Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-white">
              Poll Options
            </label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center space-x-2 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Option</span>
            </button>
          </div>

          <div className="space-y-4">
            {pollData.options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <LiquidGlass className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-white">Option {index + 1}</h4>
                    {pollData.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="p-1 text-white/50 hover:text-white transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Text Content */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={option.title}
                          onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                          placeholder="Activity title"
                          className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">
                          Description
                        </label>
                        <textarea
                          value={option.description}
                          onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                          placeholder="Describe this activity..."
                          className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none text-sm"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-white/70 mb-1">
                        Image
                      </label>
                      <div className="relative">
                        {option.imageUrl ? (
                          <div className="relative h-32 rounded-lg overflow-hidden">
                            <img
                              src={option.imageUrl}
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => updateOption(option.id, 'imageUrl', '')}
                              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors duration-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="block w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-colors duration-200 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(option.id, e.target.files[0])}
                              className="hidden"
                            />
                            <div className="flex flex-col items-center justify-center h-full text-white/50 hover:text-white/70 transition-colors duration-200">
                              <ImageIcon className="w-8 h-8 mb-2" />
                              <span className="text-sm">Upload Image</span>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-accent-primary text-white font-semibold rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating Poll...</span>
            </div>
          ) : (
            'Create Poll'
          )}
        </button>
      </form>
    </div>
  );
} 