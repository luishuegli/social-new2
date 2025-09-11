'use client';

import React from 'react';

interface PortfolioFilterProps {
  activeFilter: 'All' | 'Live' | 'Collaborative';
  onFilterChange: (v: 'All' | 'Live' | 'Collaborative') => void;
}

const filters: Array<PortfolioFilterProps['activeFilter']> = ['All', 'Live', 'Collaborative'];

export default function PortfolioFilter({ activeFilter, onFilterChange }: PortfolioFilterProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-background-secondary/40 rounded-xl p-1">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeFilter === f
              ? 'bg-background-secondary text-content-primary'
              : 'text-content-secondary hover:text-content-primary hover:bg-background-secondary/60'
          }`}
          aria-pressed={activeFilter === f}
        >
          {f}
        </button>
      ))}
    </div>
  );
}


