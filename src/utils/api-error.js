/**
 * Custom operational API Error class for consistent backend error handling.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} message - Error description
   * @param {string} [code] - Machine readable error code (e.g. INVALID_CREDENTIALS)
   * @param {Array|object} [details] - Optional validation or contextual details
   */
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED', details = null) {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Access denied. Insufficient permissions', code = 'FORBIDDEN', details = null) {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT', details = null) {
    return new ApiError(409, message, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR', details = null) {
    return new ApiError(500, message, code, details);
  }
}
