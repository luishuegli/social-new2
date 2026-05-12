import React from 'react';

interface PaginationTriggerProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  children?: React.ReactNode;
}

export const PaginationTrigger: React.FC<PaginationTriggerProps> = ({
  onLoadMore,
  loading,
  hasMore,
  children
}) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center py-8">
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
        </div>
      ) : (
        <button
          onClick={onLoadMore}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white font-medium transition-all duration-200"
        >
          Load More
        </button>
      )}
      {children}
    </div>
  );
};

interface InfiniteScrollTriggerProps {
  triggerRef: React.RefObject<HTMLDivElement | null> | null;
  loading: boolean;
  hasMore: boolean;
}

export const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  triggerRef,
  loading,
  hasMore
}) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {loading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-primary"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}
    </div>
  );
};
