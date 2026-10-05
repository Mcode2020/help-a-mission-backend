import { env } from '../config/env.js';

/**
 * Not Found (404) Handler Middleware
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'production' ? {} : { stack: err.stack })
  });
}
