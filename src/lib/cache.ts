/**
 * Caching Layer using Redis/Upstash
 * 
 * Provides:
 * - In-memory cache for development
 * - Redis cache for production
 * - TTL support
 * - Cache invalidation
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger';

// In-memory cache for development/fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

// Redis client (initialized if credentials are available)
let redis: Redis | null = null;

// Initialize Redis if credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info('Redis cache initialized', undefined, 'cache');
  } catch (error) {
    logger.error('Failed to initialize Redis cache', error, 'cache');
  }
} else {
  logger.warn('Redis cache disabled: Missing Upstash Redis credentials', undefined, 'cache');
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  tags?: string[]; // Cache tags for invalidation
  key?: string; // Custom cache key
}

/**
 * Generate cache key
 */
function generateCacheKey(prefix: string, key: string): string {
  return `cache:${prefix}:${key}`;
}

/**
 * Get value from cache
 */
export async function getCache<T = any>(
  prefix: string,
  key: string
): Promise<T | null> {
  const cacheKey = generateCacheKey(prefix, key);

  try {
    if (redis) {
      // Use Redis
      const value = await redis.get<T>(cacheKey);
      if (value) {
        logger.debug('Cache hit (Redis)', { prefix, key }, 'cache');
        return value;
      }
    } else {
      // Use in-memory cache
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        logger.debug('Cache hit (memory)', { prefix, key }, 'cache');
        return cached.data as T;
      } else if (cached) {
        // Expired, remove it
        memoryCache.delete(cacheKey);
      }
    }

    logger.debug('Cache miss', { prefix, key }, 'cache');
    return null;
  } catch (error) {
    logger.error('Cache get error', error, 'cache');
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache<T = any>(
  prefix: string,
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const cacheKey = generateCacheKey(prefix, key);
  const ttl = options.ttl || 300; // Default 5 minutes

  try {
    if (redis) {
      // Use Redis with TTL
      await redis.setex(cacheKey, ttl, value);
      logger.debug('Cache set (Redis)', { prefix, key, ttl }, 'cache');
    } else {
      // Use in-memory cache
      memoryCache.set(cacheKey, {
        data: value,
        expires: Date.now() + (ttl * 1000),
      });
      logger.debug('Cache set (memory)', { prefix, key, ttl }, 'cache');
    }

    return true;
  } catch (error) {
    logger.error('Cache set error', error, 'cache');
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(prefix: string, key: string): Promise<boolean> {
  const cacheKey = generateCacheKey(prefix, key);

  try {
    if (redis) {
      await redis.del(cacheKey);
    } else {
      memoryCache.delete(cacheKey);
    }

    logger.debug('Cache deleted', { prefix, key }, 'cache');
    return true;
  } catch (error) {
    logger.error('Cache delete error', error, 'cache');
    return false;
  }
}

/**
 * Invalidate cache by prefix (delete all keys with prefix)
 */
export async function invalidateCache(prefix: string): Promise<boolean> {
  try {
    if (redis) {
      // Get all keys with prefix
      const pattern = generateCacheKey(prefix, '*');
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated (Redis)', { prefix, count: keys.length }, 'cache');
      }
    } else {
      // In-memory: delete all keys with prefix
      const prefixKey = generateCacheKey(prefix, '');
      let count = 0;
      
      for (const key of memoryCache.keys()) {
        if (key.startsWith(prefixKey)) {
          memoryCache.delete(key);
          count++;
        }
      }
      
      logger.info('Cache invalidated (memory)', { prefix, count }, 'cache');
    }

    return true;
  } catch (error) {
    logger.error('Cache invalidation error', error, 'cache');
    return false;
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  prefix: string,
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(prefix, key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Store in cache
  await setCache(prefix, key, result, options);

  return result;
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    if (redis) {
      // In production, you might want to be more selective
      logger.warn('Clearing all Redis cache', undefined, 'cache');
      // Note: Redis doesn't have a direct "clear all" command
      // You'd need to use FLUSHDB or FLUSHALL (not recommended in production)
    } else {
      memoryCache.clear();
      logger.info('Memory cache cleared', undefined, 'cache');
    }

    return true;
  } catch (error) {
    logger.error('Cache clear error', error, 'cache');
    return false;
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  size: number;
  keys?: number;
}> {
  if (redis) {
    // Redis stats would require INFO command
    return { type: 'redis', size: 0 };
  } else {
    return {
      type: 'memory',
      size: memoryCache.size,
    };
  }
}


