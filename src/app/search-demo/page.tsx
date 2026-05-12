'use client';

/**
 * Search Demo Page
 * 
 * This page demonstrates all search features in one place.
 * Visit: http://localhost:3000/search-demo
 * 
 * Features shown:
 * - Basic search
 * - Real-time results
 * - Loading states
 * - Error handling
 * - Different result types (users vs groups)
 * - Keyboard shortcuts
 */

import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchResults from '../components/SearchResults';
import { Search, X, Zap, Users, User, TrendingUp, Clock } from 'lucide-react';

export default function SearchDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'basic' | 'advanced' | 'modal'>('basic');
  const { query, setQuery, results, isSearching, clearSearch, error } = useSearch({
    debounceMs: 300,
    minQueryLength: 1
  });

  const [showModal, setShowModal] = useState(false);

  // Sample search suggestions
  const suggestions = [
    'john', 'sarah', 'hiking', 'book club', 'tech', 'sports'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary to-background-secondary">
      {/* Header */}
      <div className="bg-white border-b border-border-separator">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-content-primary mb-2">
            🔍 Search & Discovery Demo
          </h1>
          <p className="text-content-secondary text-lg">
            Interactive demonstration of the intelligent search system
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Demo Selector */}
        <div className="liquid-glass rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-content-primary mb-4">
            Choose a Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveDemo('basic')}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeDemo === 'basic'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-separator hover:border-accent-primary/50'
              }`}
            >
              <Search className="w-8 h-8 mb-2 mx-auto text-accent-primary" />
              <h3 className="font-semibold text-content-primary">Basic Search</h3>
              <p className="text-sm text-content-secondary mt-2">
                Simple search with real-time results
              </p>
            </button>

            <button
              onClick={() => setActiveDemo('advanced')}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeDemo === 'advanced'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-separator hover:border-accent-primary/50'
              }`}
            >
              <Zap className="w-8 h-8 mb-2 mx-auto text-accent-primary" />
              <h3 className="font-semibold text-content-primary">Advanced Features</h3>
              <p className="text-sm text-content-secondary mt-2">
                With filters, stats, and more
              </p>
            </button>

            <button
              onClick={() => setActiveDemo('modal')}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeDemo === 'modal'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-separator hover:border-accent-primary/50'
              }`}
            >
              <TrendingUp className="w-8 h-8 mb-2 mx-auto text-accent-primary" />
              <h3 className="font-semibold text-content-primary">Modal Search</h3>
              <p className="text-sm text-content-secondary mt-2">
                Command palette style (⌘K)
              </p>
            </button>
          </div>
        </div>

        {/* Basic Demo */}
        {activeDemo === 'basic' && (
          <div className="liquid-glass rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-content-primary mb-4">
              Basic Search Demo
            </h2>
            <p className="text-content-secondary mb-6">
              Start typing to see real-time search results. Try searching for users or groups.
            </p>

            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users and groups..."
                className="w-full pl-12 pr-12 py-4 bg-background-secondary border border-border-separator rounded-lg text-content-primary placeholder-content-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all text-lg"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-content-secondary" />
                </button>
              )}

              <SearchResults
                results={results}
                isLoading={isSearching}
                onResultClick={clearSearch}
              />
            </div>

            {/* Suggestions */}
            {!query && (
              <div className="mt-6">
                <p className="text-sm text-content-secondary mb-3">Try these searches:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuery(suggestion)}
                      className="px-4 py-2 bg-background-secondary hover:bg-accent-primary/10 rounded-lg text-content-primary transition-colors border border-border-separator"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Demo */}
        {activeDemo === 'advanced' && (
          <div className="space-y-6">
            <div className="liquid-glass rounded-xl p-6">
              <h2 className="text-2xl font-bold text-content-primary mb-4">
                Advanced Search Demo
              </h2>

              {/* Search with stats */}
              <div className="relative max-w-2xl mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search with live statistics..."
                  className="w-full pl-12 pr-12 py-4 bg-background-secondary border border-border-separator rounded-lg text-content-primary placeholder-content-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all text-lg"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background-tertiary rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-content-secondary" />
                  </button>
                )}

                <SearchResults
                  results={results}
                  isLoading={isSearching}
                  onResultClick={clearSearch}
                />
              </div>

              {/* Statistics */}
              {query && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-background-secondary rounded-lg p-4 border border-border-separator">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Search className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-content-primary">
                          {results.length}
                        </p>
                        <p className="text-sm text-content-secondary">Total Results</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background-secondary rounded-lg p-4 border border-border-separator">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-content-primary">
                          {results.filter(r => r.type === 'user').length}
                        </p>
                        <p className="text-sm text-content-secondary">Users Found</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background-secondary rounded-lg p-4 border border-border-separator">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-content-primary">
                          {results.filter(r => r.type === 'group').length}
                        </p>
                        <p className="text-sm text-content-secondary">Groups Found</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state indicator */}
              {isSearching && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    <p className="text-blue-800">Searching in real-time...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">❌ Search error: {error.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Demo */}
        {activeDemo === 'modal' && (
          <div className="liquid-glass rounded-xl p-6">
            <h2 className="text-2xl font-bold text-content-primary mb-4">
              Modal Search Demo
            </h2>
            <p className="text-content-secondary mb-6">
              Click the button below or press <kbd className="px-2 py-1 bg-background-secondary rounded border border-border-separator">⌘K</kbd> to open the search modal.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="liquid-glass hover:bg-accent-primary/10 px-6 py-3 rounded-lg font-semibold text-content-primary transition-all flex items-center gap-3"
            >
              <Search className="w-5 h-5" />
              Open Search Modal
              <kbd className="ml-auto px-2 py-1 text-xs bg-background-secondary rounded border border-border-separator">⌘K</kbd>
            </button>
          </div>
        )}

        {/* Feature List */}
        <div className="liquid-glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-content-primary mb-4">
            ✨ Features Demonstrated
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Real-time Search</h3>
                <p className="text-sm text-content-secondary">Results update as you type</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Debouncing</h3>
                <p className="text-sm text-content-secondary">300ms delay prevents API spam</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Relevance Scoring</h3>
                <p className="text-sm text-content-secondary">Intelligent result ranking</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Multi-type Search</h3>
                <p className="text-sm text-content-secondary">Users and groups simultaneously</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Loading States</h3>
                <p className="text-sm text-content-secondary">Visual feedback during search</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-content-primary">Error Handling</h3>
                <p className="text-sm text-content-secondary">Graceful failure modes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="liquid-glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-content-primary mb-4">
            📝 Usage Example
          </h2>
          <p className="text-content-secondary mb-4">
            Here's how easy it is to add search to any component:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
{`import { useSearch } from '@/app/hooks/useSearch';
import SearchResults from '@/app/components/SearchResults';

export default function MyComponent() {
  const { query, setQuery, results, isSearching } = useSearch();

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <SearchResults
        results={results}
        isLoading={isSearching}
      />
    </div>
  );
}`}
          </pre>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
                <button
                  onClick={() => {
                    setShowModal(false);
                    clearSearch();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

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
                    setShowModal(false);
                    clearSearch();
                  }}
                />
              )}

              {!isSearching && query && results.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







