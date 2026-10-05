// In-memory rate limiter middleware for DDOS & abuse prevention
const rateLimitMap = new Map();

/**
 * Creates a rate limiting middleware function
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Max requests allowed per IP in window
 * @param {string} message - Custom error message
 */
export function createRateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests from this IP, please try again later.') {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
    } else {
      record.count += 1;
    }

    rateLimitMap.set(key, record);

    if (record.count > maxRequests) {
      res.status(429).json({
        status: 'error',
        message,
        retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000)
      });
      return;
    }

    next();
  };
}

export const generalLimiter = createRateLimiter(15 * 60 * 1000, 150);
export const submissionLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Submission limit reached for this IP. Please wait before submitting again.');
