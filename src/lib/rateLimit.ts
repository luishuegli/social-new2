import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * Rate limiting configuration for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints - stricter limits
  auth: {
    signin: { requests: 5, window: '1m' },     // 5 attempts per minute
    signup: { requests: 3, window: '5m' },     // 3 signups per 5 minutes
    reset: { requests: 3, window: '15m' },     // 3 reset attempts per 15 minutes
  },
  
  // API endpoints - balanced limits
  api: {
    posts: {
      read: { requests: 100, window: '1m' },   // 100 reads per minute
      write: { requests: 10, window: '1m' },   // 10 posts per minute
    },
    messages: {
      send: { requests: 30, window: '1m' },    // 30 messages per minute
      read: { requests: 100, window: '1m' },   // 100 reads per minute
    },
    upload: { requests: 5, window: '1m' },     // 5 uploads per minute
    search: { requests: 30, window: '1m' },    // 30 searches per minute
    activities: {
      create: { requests: 5, window: '1m' },   // 5 activities per minute
      rsvp: { requests: 10, window: '1m' },    // 10 RSVPs per minute
    },
    groups: {
      create: { requests: 3, window: '5m' },   // 3 groups per 5 minutes
      join: { requests: 10, window: '5m' },    // 10 joins per 5 minutes
    },
  },
  
  // General fallback limit
  default: { requests: 60, window: '1m' }      // 60 requests per minute
};

// Initialize Redis client for rate limiting
// In production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;
let ratelimiter: Ratelimit | null = null;

// Initialize rate limiter if Redis credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a global rate limiter with sliding window algorithm
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1m'), // Default: 60 requests per minute
      analytics: true, // Enable analytics for monitoring
      prefix: 'social-app',
    });

    logger.info('Rate limiting initialized with Upstash Redis', undefined, 'rateLimit');
  } catch (error) {
    logger.error('Failed to initialize rate limiting', error, 'rateLimit');
  }
} else {
  logger.warn('Rate limiting disabled: Missing Upstash Redis credentials', undefined, 'rateLimit');
}

/**
 * Custom rate limiter factory for specific endpoints
 */
export function createRateLimiter(
  requests: number,
  window: string
): Ratelimit | null {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as any),
    analytics: true,
    prefix: 'social-app',
  });
}

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if available
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  request: NextRequest,
  config: { requests: number; window: string },
  userId?: string
): Promise<{ success: boolean; response?: NextResponse }> {
  // Skip rate limiting in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && 
      process.env.ENABLE_RATE_LIMIT_DEV !== 'true') {
    return { success: true };
  }

  // If rate limiting is not configured, allow the request
  if (!ratelimiter) {
    return { success: true };
  }

  const identifier = getIdentifier(request, userId);
  
  try {
    // Create custom rate limiter for this endpoint
    const limiter = createRateLimiter(config.requests, config.window);
    
    if (!limiter) {
      return { success: true };
    }

    // Check rate limit
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    // Add rate limit headers to help clients
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    };

    if (!success) {
      logger.warn('Rate limit exceeded', { 
        identifier, 
        endpoint: request.url,
        limit,
        window: config.window 
      }, 'rateLimit');

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again after ${new Date(reset).toISOString()}`,
            retryAfter: reset,
          },
          { 
            status: 429,
            headers 
          }
        ),
      };
    }

    // Request is within rate limit
    return { 
      success: true,
      response: undefined // Will add headers in the actual response
    };

  } catch (error) {
    // If rate limiting fails, log the error but allow the request
    logger.error('Rate limiting error', error, 'rateLimit');
    return { success: true };
  }
}

/**
 * Express-style middleware wrapper for easier use
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: { requests: number; window: string } = RATE_LIMIT_CONFIG.default
) {
  return async (request: NextRequest) => {
    // Extract user ID from authorization header if available
    let userId: string | undefined;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // For now, we'll use the token as a simple identifier
      // In production, you'd decode the JWT to get the actual user ID
      userId = authHeader.split(' ')[1].substring(0, 20); // Use first 20 chars of token
    }

    // Check rate limit
    const { success, response } = await rateLimit(request, config, userId);
    
    if (!success && response) {
      return response;
    }

    // Call the actual handler
    const handlerResponse = await handler(request);
    
    // Add rate limit headers to successful responses
    if (ratelimiter && userId) {
      const identifier = getIdentifier(request, userId);
      const limiter = createRateLimiter(config.requests, config.window);
      
      if (limiter) {
        try {
          const { limit, reset, remaining } = await limiter.limit(identifier);
          
          handlerResponse.headers.set('X-RateLimit-Limit', limit.toString());
          handlerResponse.headers.set('X-RateLimit-Remaining', Math.max(0, remaining - 1).toString());
          handlerResponse.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
        } catch (error) {
          // Ignore errors when adding headers
        }
      }
    }

    return handlerResponse;
  };
}

/**
 * IP-based rate limiting for public endpoints
 */
export async function ipRateLimit(
  request: NextRequest,
  config: { requests: number; window: string } = RATE_LIMIT_CONFIG.default
): Promise<{ success: boolean; response?: NextResponse }> {
  return rateLimit(request, config);
}

/**
 * User-based rate limiting for authenticated endpoints
 */
export async function userRateLimit(
  request: NextRequest,
  userId: string,
  config: { requests: number; window: string } = RATE_LIMIT_CONFIG.default
): Promise<{ success: boolean; response?: NextResponse }> {
  return rateLimit(request, config, userId);
}

// Export types
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG;
export type RateLimitResult = {
  success: boolean;
  response?: NextResponse;
};


