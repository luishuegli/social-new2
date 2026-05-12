/**
 * Dev Route Protection
 * 
 * Protects dev/debug routes from being accessed in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { createErrorResponse } from './apiMiddleware';

/**
 * Check if route is a dev route
 */
export function isDevRoute(pathname: string): boolean {
  const devPatterns = [
    '/api/debug-',
    '/api/test-',
    '/api/seed-',
    '/api/clear-seed',
    '/api/apply-indexes',
    '/api/setup-firestore-indexes',
    '/api/update-firebase-rules',
    '/api/current-rules',
    '/api/deploy-rules',
    '/api/dev-utils',
    '/api/fix-',
    '/api/add-',
    '/api/force-',
    '/api/refresh-activities',
    '/api/migrate-',
    '/api/generate-suggestions',
    '/api/rerank-suggestions',
    '/api/reset-voting',
    '/api/finalize-poll',
  ];
  
  return devPatterns.some(pattern => pathname.includes(pattern));
}

/**
 * Protect dev route - returns error if accessed in production
 */
export function protectDevRoute(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  if (isDevRoute(pathname)) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Dev route accessed in production', { pathname }, 'dev-protection');
      return createErrorResponse(
        'Not Found',
        'This endpoint is not available in production',
        404,
        'DEV_ROUTE_BLOCKED'
      );
    }
    
    // In development, log access
    logger.debug('Dev route accessed', { pathname }, 'dev-protection');
  }
  
  return null;
}

/**
 * Wrapper for dev route handlers
 */
export function withDevProtection<T = any>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | any>> => {
    // Check if route is protected
    const error = protectDevRoute(request);
    if (error) {
      return error as NextResponse<T>;
    }
    
    // Call the handler
    return handler(request);
  };
}
