import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory sliding window rate limiter.
 *
 * Uses a per-IP counter with automatic cleanup of expired entries.
 * Suitable for Cloud Run where each container instance maintains its own
 * in-memory state. For a distributed rate limiter, use Redis or similar.
 */

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
}

interface WindowEntry {
  timestamps: number[];
}

export function rateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests } = config;
  const store = new Map<string, WindowEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, windowMs * 2);

  // Allow the Node.js process to exit even if the interval is still active
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use X-Forwarded-For (Cloud Run sets this) or fall back to socket address
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry) {
      entry = { timestamps: [] };
      store.set(ip, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    entry.timestamps.push(now);

    // Set informational rate-limit headers
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - entry.timestamps.length));

    next();
  };
}

// ---- Pre-configured limiters ----

/** General API routes: 100 requests per minute */
export const apiLimiter = rateLimiter({ windowMs: 60_000, maxRequests: 100 });

/** Authentication endpoints: 10 requests per minute */
export const authLimiter = rateLimiter({ windowMs: 60_000, maxRequests: 10 });

/** AI / LLM endpoints: 30 requests per minute */
export const aiLimiter = rateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Admin endpoints: 20 requests per minute */
export const adminLimiter = rateLimiter({ windowMs: 60_000, maxRequests: 20 });
