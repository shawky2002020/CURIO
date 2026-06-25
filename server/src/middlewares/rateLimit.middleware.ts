import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Rate limiting middleware.
 * In production, this will use 'express-rate-limit' or Redis.
 */
export const rateLimiter = (limit = 5, windowMins = 15) => {
  // Simple custom memory-based placeholder rate limiter:
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMins * 60 * 1000;

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const timestamps = requests.get(ip)!;
    // Filter timestamps within the current window
    const activeTimestamps = timestamps.filter((time) => now - time < windowMs);
    
    if (activeTimestamps.length >= limit) {
      return next(
        new ApiError(
          429,
          `Too many requests. Please try again after ${windowMins} minutes.`,
          'TOO_MANY_REQUESTS'
        )
      );
    }

    activeTimestamps.push(now);
    requests.set(ip, activeTimestamps);
    next();
  };
};
