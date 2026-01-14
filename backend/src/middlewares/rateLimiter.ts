import { Request, Response, NextFunction } from 'express';
import getRedisClient from '../core/redis';
import Logger from '../core/Logger';
import { recordMetric } from './performanceMonitoring';

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds (1 minute)
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

/**
 * Minimal IP-based rate limiting middleware
 * Uses Redis for distributed rate limiting with sliding window
 */
export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get client IP
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${clientIp}`;

    // Get Redis client
    const redis = await getRedisClient();

    // Increment request count
    const currentCount = await redis.incr(key);

    // Set expiry on first request
    if (currentCount === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    // Get TTL for rate limit headers
    const ttl = await redis.ttl(key);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - currentCount));
    res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

    // Check if limit exceeded
    if (currentCount > RATE_LIMIT_MAX_REQUESTS) {
      Logger.warn(`Rate limit exceeded for IP: ${clientIp} (${currentCount} requests)`);
      
      // Record metric (optional)
      recordMetric('RateLimit/Exceeded', 1);

      return res.status(429).json({
        statusCode: '10003',
        status: 429,
        message: 'Too many requests. Please try again later.',
        retryAfter: ttl,
      });
    }

    next();
  } catch (error) {
    // If rate limiter fails, allow request through (fail open)
    Logger.error('Rate limiter error:', error);
    next();
  }
};
