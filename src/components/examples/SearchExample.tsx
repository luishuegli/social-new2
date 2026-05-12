'use client';

/**
 * Example component demonstrating how to use the search system
 * This file shows different use cases and patterns
 */

import React, { useState } from 'react';
import { useSearch } from '../../app/hooks/useSearch';
import SearchResults from '../../app/components/SearchResults';
import { Search, X, Filter } from 'lucide-react';

/**
 * Example 1: Basic Search
 * Simplest implementation - just hook + input + results
 */
export function BasicSearchExample() {
  const { query, setQuery, results, isSearching } = useSearch();

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users and groups..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        
        <SearchResults
          results={results}
          isLoading={isSearching}
        />
      </div>
    </div>
  );
}

/**
 * Example 2: Advanced Search with Clear Button
 * Includes clear functionality and loading state
 */
export function AdvancedSearchExample() {
  const { query, setQuery, results, isSearching, clearSearch } = useSearch({
    debounceMs: 500, // Custom debounce delay
    minQueryLength: 2 // Only search when 2+ characters
  });

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <SearchResults
          results={results}
          isLoading={isSearching}
          onResultClick={clearSearch}
        />
      )}
      
      {query && !isSearching && results.length === 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Search with Filters (UI only - backend filtering to be implemented)
 * Shows how you could add filter options
 */
export function SearchWithFiltersExample() {
  const { query, setQuery, results, isSearching } = useSearch();
  const [filterType, setFilterType] = useState<'all' | 'user' | 'group'>('all');

  // Filter results on client side (in production, this should be done on server)
  const filteredResults = filterType === 'all' 
    ? results 
    : results.filter(r => r.type === filterType);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('user')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'group'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
        </div>

        {/* Results */}
        <SearchResults
          results={filteredResults}
          isLoading={isSearching}
        />
      </div>
    </div>
  );
}

/**
 * Example 4: Search Page
 * Full-page search experience with keyboard shortcuts
 */
export function SearchPageExample() {
  const { query, setQuery, results, isSearching, clearSearch } = useSearch();
  const [recentSearches] = useState<string[]>(['hiking', 'book club', 'tech meetup']);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">Find people, groups, and activities</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users and groups... (⌘K)"
              className="w-full pl-14 pr-14 py-4 text-lg rounded-lg border-2 border-transparent focus:border-blue-500 focus:outline-none"
            />
            
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Searches (when no query) */}
        {!query && recentSearches.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Search className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <div className="bg-white rounded-xl shadow">
            {isSearching && (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                <p className="text-gray-600">Searching...</p>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Results for "{query}"
                </h3>
                <SearchResults
                  results={results}
                  isLoading={false}
                  onResultClick={clearSearch}
                />
              </div>
            )}

            {!isSearching && results.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try searching for something else
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 5: Modal Search (like Cmd+K interfaces)
 */
export function SearchModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const { query, setQuery, results, isSearching, clearSearch } = useSearch();

  // Open with Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
      >
        <Search className="w-5 h-5 text-gray-400" />
        <span className="text-gray-600">Search...</span>
        <kbd className="ml-auto px-2 py-1 text-xs bg-gray-100 rounded border border-gray-200">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users and groups..."
              autoFocus
              className="w-full pl-10 pr-10 py-3 text-lg focus:outline-none"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {isSearching && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {results.length > 0 && (
            <SearchResults
              results={results}
              isLoading={false}
              onResultClick={() => {
                setIsOpen(false);
                clearSearch();
              }}
            />
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







