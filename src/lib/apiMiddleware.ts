/**
 * Comprehensive API Middleware System
 * 
 * Handles:
 * - Authentication
 * - Rate limiting
 * - Input validation
 * - Error handling
 * - Dev route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/Lib/firebaseAdmin';
import { rateLimit, RATE_LIMIT_CONFIG, RateLimitConfig } from './rateLimit';
import { validateRequestBody, validateQueryParams, validationErrorResponse } from './validation';
import { logger } from './logger';
import { z } from 'zod';

/**
 * Standard API error response format
 */
export interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
}

/**
 * Standard API success response format
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Standard error response formatter
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 500,
  code?: string,
  details?: any,
  requestId?: string
): NextResponse<APIResponse> {
  const errorResponse: APIError = {
    error,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: '',
  };

  return NextResponse.json(
    {
      success: false,
      error: errorResponse,
      meta: requestId ? {
        timestamp: new Date().toISOString(),
        requestId,
      } : undefined,
    } as APIResponse,
    { status }
  );
}

/**
 * Standard success response formatter
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: requestId ? {
        timestamp: new Date().toISOString(),
        requestId,
      } : undefined,
    } as APIResponse<T>,
    { status }
  );
}

/**
 * Extract user ID from authorization token
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    logger.debug('Token verification failed', error, 'middleware');
    return null;
  }
}

/**
 * Check if route is a dev/debug route
 */
function isDevRoute(pathname: string): boolean {
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
 * Middleware options
 */
export interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: { requests: number; window: string } | false;
  validateBody?: z.ZodSchema;
  validateQuery?: z.ZodSchema;
  allowDev?: boolean; // Allow dev routes in production (default: false)
}

/**
 * Comprehensive API middleware wrapper
 */
export function withMiddleware<T = any>(
  handler: (request: NextRequest, userId: string | null) => Promise<NextResponse<T>>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const pathname = request.nextUrl.pathname;

    // Add request ID to headers for tracking
    request.headers.set('X-Request-ID', requestId);

    try {
      // 1. Check if dev route and protect it
      if (isDevRoute(pathname)) {
        if (!options.allowDev && process.env.NODE_ENV === 'production') {
          logger.warn('Dev route accessed in production', { pathname, requestId }, 'middleware');
          return createErrorResponse(
            'Not Found',
            'This endpoint is not available in production',
            404,
            'DEV_ROUTE_BLOCKED',
            undefined,
            requestId
          );
        }
        
        // In development, log dev route access
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Dev route accessed', { pathname, requestId }, 'middleware');
        }
      }

      // 2. Authentication
      let userId: string | null = null;
      
      if (options.requireAuth !== false) {
        userId = await getUserIdFromRequest(request);
        
        if (!userId) {
          logger.warn('Unauthorized request', { pathname, requestId }, 'middleware');
          return createErrorResponse(
            'Unauthorized',
            'Authentication required',
            401,
            'AUTH_REQUIRED',
            undefined,
            requestId
          );
        }
      }

      // 3. Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitConfig = options.rateLimit || RATE_LIMIT_CONFIG.default;
        const { success, response } = await rateLimit(request, rateLimitConfig, userId || undefined);
        
        if (!success && response) {
          return response;
        }
      }

      // 4. Input validation - Body
      if (options.validateBody) {
        const validation = await validateRequestBody(request, options.validateBody);
        
        if (!validation.success) {
          return validation.response;
        }
        
        // Attach validated body to request for handler
        (request as any).validatedBody = validation.data;
      }

      // 5. Input validation - Query params
      if (options.validateQuery) {
        const validation = validateQueryParams(request.nextUrl.searchParams, options.validateQuery);
        
        if (!validation.success) {
          return validation.response;
        }
        
        // Attach validated query to request for handler
        (request as any).validatedQuery = validation.data;
      }

      // 6. Call the actual handler
      const response = await handler(request, userId);
      
      // 7. Add standard headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;

    } catch (error: any) {
      // Handle errors consistently
      logger.error('Middleware error', { 
        error: error.message, 
        stack: error.stack,
        pathname,
        requestId 
      }, 'middleware');

      // Check if it's a validation error
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }

      // Check if it's a known error with status code
      if (error.statusCode) {
        return createErrorResponse(
          error.name || 'Error',
          error.message || 'An error occurred',
          error.statusCode,
          error.code,
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
          requestId
        );
      }

      // Generic error
      return createErrorResponse(
        'Internal Server Error',
        process.env.NODE_ENV === 'development' 
          ? error.message || 'An unexpected error occurred'
          : 'An unexpected error occurred. Please try again later.',
        500,
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
        requestId
      );
    }
  };
}

/**
 * Helper for authenticated routes
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse<T>>,
  options: Omit<MiddlewareOptions, 'requireAuth'> = {}
) {
  return withMiddleware(async (request, userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return handler(request, userId);
  }, { ...options, requireAuth: true });
}

/**
 * Helper for public routes (no auth required)
 */
export function withPublic<T = any>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: Omit<MiddlewareOptions, 'requireAuth'> = {}
) {
  return withMiddleware(async (request, userId) => {
    return handler(request);
  }, { ...options, requireAuth: false });
}

/**
 * Helper for dev routes
 */
export function withDev<T = any>(
  handler: (request: NextRequest, userId: string | null) => Promise<NextResponse<T>>,
  options: Omit<MiddlewareOptions, 'allowDev'> = {}
) {
  return withMiddleware(handler, { ...options, allowDev: true });
}
