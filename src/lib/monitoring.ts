/**
 * Monitoring and Metrics System
 * 
 * Tracks:
 * - API request metrics
 * - Error rates
 * - Response times
 * - Cache hit rates
 */

import { logger } from './logger';

/**
 * Metric types
 */
export type MetricType = 
  | 'api_request'
  | 'api_error'
  | 'api_response_time'
  | 'cache_hit'
  | 'cache_miss'
  | 'database_query'
  | 'external_api_call';

/**
 * Metric data structure
 */
export interface Metric {
  type: MetricType;
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

/**
 * In-memory metrics store (for development)
 * In production, send to monitoring service (e.g., DataDog, CloudWatch, Prometheus)
 */
const metrics: Metric[] = [];

/**
 * Maximum metrics to keep in memory
 */
const MAX_METRICS = 1000;

/**
 * Record a metric
 */
export function recordMetric(
  type: MetricType,
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  const metric: Metric = {
    type,
    name,
    value,
    tags,
    timestamp: Date.now(),
  };

  metrics.push(metric);

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to monitoring service
    // sendToMonitoringService(metric);
    
    // For now, log important metrics
    if (type === 'api_error' || (type === 'api_response_time' && value > 1000)) {
      logger.warn('Metric recorded', metric, 'monitoring');
    }
  }
}

/**
 * Record API request
 */
export function recordAPIRequest(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
): void {
  recordMetric('api_request', `${method} ${endpoint}`, 1, {
    method,
    endpoint,
    statusCode: statusCode.toString(),
  });

  recordMetric('api_response_time', `${method} ${endpoint}`, responseTime, {
    method,
    endpoint,
    statusCode: statusCode.toString(),
  });

  if (statusCode >= 400) {
    recordMetric('api_error', `${method} ${endpoint}`, 1, {
      method,
      endpoint,
      statusCode: statusCode.toString(),
    });
  }
}

/**
 * Record cache operation
 */
export function recordCacheOperation(hit: boolean, prefix: string, key: string): void {
  recordMetric(
    hit ? 'cache_hit' : 'cache_miss',
    `${prefix}:${key}`,
    1,
    { prefix, key }
  );
}

/**
 * Record database query
 */
export function recordDatabaseQuery(
  collection: string,
  operation: string,
  duration: number
): void {
  recordMetric('database_query', `${collection}.${operation}`, duration, {
    collection,
    operation,
  });
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(): {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorsByEndpoint: Record<string, number>;
} {
  const requests = metrics.filter(m => m.type === 'api_request');
  const errors = metrics.filter(m => m.type === 'api_error');
  const responseTimes = metrics.filter(m => m.type === 'api_response_time');
  const cacheHits = metrics.filter(m => m.type === 'cache_hit');
  const cacheMisses = metrics.filter(m => m.type === 'cache_miss');

  const errorsByEndpoint: Record<string, number> = {};
  errors.forEach(error => {
    const endpoint = error.tags?.endpoint || 'unknown';
    errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
  });

  const totalCacheOps = cacheHits.length + cacheMisses.length;
  const cacheHitRate = totalCacheOps > 0 
    ? (cacheHits.length / totalCacheOps) * 100 
    : 0;

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, m) => sum + m.value, 0) / responseTimes.length
    : 0;

  return {
    totalRequests: requests.length,
    totalErrors: errors.length,
    averageResponseTime: avgResponseTime,
    cacheHitRate,
    errorsByEndpoint,
  };
}

/**
 * Clear metrics (for testing)
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Middleware to track API requests
 */
export function trackAPIRequest(
  endpoint: string,
  method: string,
  startTime: number
) {
  return (statusCode: number) => {
    const responseTime = Date.now() - startTime;
    recordAPIRequest(endpoint, method, statusCode, responseTime);
  };
}


