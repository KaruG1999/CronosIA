// =========================================
// CronosAI Ops - Rate Limiting Middleware
// Simple in-memory rate limiter for abuse protection
// =========================================

import type { Request, Response, NextFunction } from 'express';

// =========================================
// Types
// =========================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

// =========================================
// In-Memory Store
// =========================================

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// =========================================
// Get Client Identifier
// =========================================

function getClientId(req: Request): string {
  // Try to get real IP from common proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  // Fallback to direct IP
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

// =========================================
// Rate Limit Middleware Factory
// =========================================

export function createRateLimiter(options: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests. Please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();

    // Get or create entry
    let entry = store.get(clientId);

    if (!entry || entry.resetAt < now) {
      // New window
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(clientId, entry);
    } else {
      // Existing window
      entry.count++;
    }

    // Set headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    // Check if over limit
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);

      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}

// =========================================
// Pre-configured Limiters
// =========================================

/**
 * Standard limiter for capability endpoints
 * 30 requests per minute per IP
 */
export const capabilityRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many capability requests. Please wait a moment before trying again.',
});

/**
 * Strict limiter for payment endpoints
 * 10 requests per minute per IP
 */
export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many payment attempts. Please wait before retrying.',
});

/**
 * Loose limiter for health/info endpoints
 * 100 requests per minute per IP
 */
export const infoRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests.',
});
