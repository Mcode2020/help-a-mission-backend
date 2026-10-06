import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

/**
 * 404 Route Not Found handler middleware.
 */
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;

  // Handle PostgreSQL specific errors (e.g., unique violation 23505)
  if (err.code === '23505') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this identifier already exists.';
    details = err.detail || null;
  } else if (err.code === '23503') {
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced entity does not exist.';
    details = err.detail || null;
  }

  // Log error details on server side
  if (statusCode >= 500) {
    console.error(`[ERROR] [${req.id || 'N/A'}] ${req.method} ${req.originalUrl}:`, err);
  }

  const responsePayload = {
    success: false,
    error: {
      message,
      code,
      details
    },
    requestId: req.id || null
  };

  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
