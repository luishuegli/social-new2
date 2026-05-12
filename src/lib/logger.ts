/**
 * Centralized logging utility for the application
 * - Logs only in development mode by default
 * - Can be extended to send logs to monitoring services (Sentry, DataDog, etc.)
 * - Provides consistent log formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isServer = typeof window === 'undefined';

  /**
   * Format log entry for consistent output
   */
  private formatLog(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const context = entry.context ? ` [${entry.context}]` : '';
    return `${prefix}${context}: ${entry.message}`;
  }

  /**
   * Send log to monitoring service (implement in production)
   */
  private sendToMonitoring(entry: LogEntry): void {
    // In production, integrate with services like:
    // - Sentry for errors
    // - DataDog/NewRelic for metrics
    // - LogRocket for session replay
    
    // Example (uncomment and configure in production):
    // if (entry.level === 'error' && typeof window !== 'undefined') {
    //   Sentry.captureException(new Error(entry.message), {
    //     extra: entry.data,
    //     contexts: { custom: { context: entry.context } }
    //   });
    // }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };

    // Always log errors
    if (level === 'error') {
      console.error(this.formatLog(entry), data);
      this.sendToMonitoring(entry);
      return;
    }

    // Log warnings in development and production
    if (level === 'warn') {
      if (this.isDevelopment || this.isServer) {
        console.warn(this.formatLog(entry), data);
      }
      this.sendToMonitoring(entry);
      return;
    }

    // Log info and debug only in development
    if (this.isDevelopment) {
      switch (level) {
        case 'info':
          console.info(this.formatLog(entry), data);
          break;
        case 'debug':
          console.log(this.formatLog(entry), data);
          break;
      }
    }
  }

  /**
   * Debug level - verbose logging for development
   */
  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  /**
   * Info level - general information
   */
  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * Warning level - potential issues
   */
  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * Error level - errors that need attention
   */
  error(message: string, data?: any, context?: string): void {
    this.log('error', message, data, context);
  }

  /**
   * Performance logging
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Group related logs (useful for complex operations)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for structured data
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing purposes
export { Logger };

// Convenience exports
export default logger;


