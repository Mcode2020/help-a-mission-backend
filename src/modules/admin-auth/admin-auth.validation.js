import { ApiError } from '../../utils/api-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const adminAuthValidation = {
  /**
   * Validate login payload.
   * @param {object} body 
   * @returns {{ email: string, password: string }} Sanitized login input
   */
  validateLogin(body) {
    if (!body || typeof body !== 'object') {
      throw ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_BODY');
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw ApiError.badRequest('Email is required.', 'MISSING_EMAIL');
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw ApiError.badRequest('Invalid email format.', 'INVALID_EMAIL');
    }

    if (!password || typeof password !== 'string') {
      throw ApiError.badRequest('Password is required.', 'MISSING_PASSWORD');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters.', 'INVALID_PASSWORD');
    }

    return {
      email: cleanEmail,
      password
    };
  }
};
