'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      // If a custom fallback component is provided, use it
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <LiquidGlass className="max-w-md w-full">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-white/70 mb-4">
                We're sorry, but something unexpected happened. Please try again.
              </p>
              
              {showDetails && process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-4">
                  <summary className="text-sm text-white/60 cursor-pointer hover:text-white/80">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </LiquidGlass>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Loading component for consistent loading states
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

// Error state component for consistent error display
export function ErrorState({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  description = 'Please try again later.',
  className = ''
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 mb-4">{description}</p>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-red-300 mb-4 font-mono">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;






