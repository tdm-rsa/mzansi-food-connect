/**
 * Client-Side Rate Limiter
 * Prevents excessive API calls from the same client
 */

class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Identifier (e.g., 'signup', 'login')
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} { allowed: boolean, remainingAttempts: number, resetTime: number }
   */
  checkLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) { // Default: 5 attempts per 15 minutes
    const now = Date.now();
    const record = this.attempts.get(key);

    // No previous attempts or window expired
    if (!record || now - record.firstAttempt > windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now
      });

      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }

    // Within window - check if limit exceeded
    if (record.count >= maxAttempts) {
      const resetTime = record.firstAttempt + windowMs;
      const waitMinutes = Math.ceil((resetTime - now) / 60000);

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime,
        waitMinutes,
        message: `Too many attempts. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`
      };
    }

    // Increment attempt count
    record.count += 1;
    this.attempts.set(key, record);

    return {
      allowed: true,
      remainingAttempts: maxAttempts - record.count,
      resetTime: record.firstAttempt + windowMs
    };
  }

  /**
   * Reset attempts for a key
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  clearAll() {
    this.attempts.clear();
  }

  /**
   * Clean up expired records
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      // Remove records older than 1 hour
      if (now - record.firstAttempt > 60 * 60 * 1000) {
        this.attempts.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Auto-cleanup every 10 minutes
setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);

export default rateLimiter;

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts'
  },
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts'
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests'
  },
  CHECKOUT: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many checkout attempts'
  },
  MESSAGE: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Too many messages sent'
  }
};
