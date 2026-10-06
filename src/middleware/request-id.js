import crypto from 'crypto';

/**
 * Express middleware to attach a unique request ID to every incoming request.
 */
export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId || crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
