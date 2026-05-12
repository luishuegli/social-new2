'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Production-ready error boundary with recovery capabilities
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };

    this.previousResetKeys = props.resetKeys;
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    // Reset error boundary when resetKeys change
    if (props.resetKeys !== undefined) {
      const hasResetKeyChanged = props.resetKeys.some((key, idx) => 
        key !== state.errorCount
      );

      if (hasResetKeyChanged && state.hasError) {
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          errorCount: state.errorCount
        };
      }
    }

    // Reset if specified prop changes
    if (props.resetOnPropsChange && state.hasError) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: state.errorCount
      };
    }

    return null;
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, componentName, level = 'component' } = this.props;

    // Log error to monitoring service
    logger.error(
      `Error boundary caught error at ${level} level`,
      {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        componentName,
        level
      },
      'ErrorBoundary'
    );

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Auto-recover after 10 seconds for non-critical errors
    if (level === 'component' && !this.props.isolate) {
      this.scheduleReset(10000);
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  scheduleReset = (delay: number): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  render(): ReactNode {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, level = 'component', isolate } = this.props;

    if (hasError && error) {
      // Too many errors - show permanent error state
      if (errorCount > 3 && !isolate) {
        return (
          <div className="liquid-glass p-6 m-4 rounded-lg">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-500 mb-2">
                Multiple Errors Detected
              </h2>
              <p className="text-content-secondary mb-4">
                This component is experiencing repeated errors. Please refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default fallback based on level
      switch (level) {
        case 'page':
          return (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="liquid-glass p-8 max-w-md w-full rounded-lg text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-content-primary mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-content-secondary mb-6">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-opacity-80 transition-colors"
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="w-full px-4 py-2 border border-border-separator text-content-secondary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    Go Back
                  </button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-content-tertiary">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 p-2 bg-background-secondary rounded text-xs overflow-auto">
                      {error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );

        case 'section':
          return (
            <div className="liquid-glass p-6 m-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">
                    Section Unavailable
                  </h3>
                  <p className="text-content-secondary text-sm mb-3">
                    This section encountered an error and cannot be displayed.
                  </p>
                  <button
                    onClick={this.resetErrorBoundary}
                    className="text-sm text-accent-primary hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          );

        case 'component':
        default:
          return (
            <div className="inline-flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-600 dark:text-red-400">
                Component error
              </span>
              {!isolate && (
                <button
                  onClick={this.resetErrorBoundary}
                  className="text-xs text-red-600 dark:text-red-400 underline"
                >
                  Retry
                </button>
              )}
            </div>
          );
      }
    }

    return children;
  }
}

/**
 * Hook to reset error boundary from child components
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}

// Export default for easier imports
export default ErrorBoundary;
