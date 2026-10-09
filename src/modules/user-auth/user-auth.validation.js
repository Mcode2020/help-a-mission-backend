// @intent Validation rules and sanitization for user registration and login requests.
import { ApiError } from '../../utils/api-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export const userAuthValidation = {
  /**
   * Validate user sign up payload.
   * @param {object} payload 
   * @returns {{ name: string, email: string, phone: string, password: string }}
   */
  validateSignUp(payload) {
    if (!payload || typeof payload !== 'object') {
      throw ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_PAYLOAD');
    }

    const { fullName, name, email, phone, password } = payload;
    const finalName = (fullName || name || '').trim();

    if (!finalName || finalName.length < 2) {
      throw ApiError.badRequest('Full name is required and must be at least 2 characters long.', 'INVALID_NAME');
    }

    if (finalName.length > 255) {
      throw ApiError.badRequest('Full name cannot exceed 255 characters.', 'INVALID_NAME');
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      throw ApiError.badRequest('A valid email address is required.', 'INVALID_EMAIL');
    }

    let rawPhone = (phone || '').trim();
    if (!rawPhone) {
      throw ApiError.badRequest('Mobile phone number is required.', 'INVALID_PHONE');
    }

    const countryCode = (payload.countryCode || '+91').trim();
    if (!rawPhone.startsWith('+')) {
      const dialPrefix = countryCode.startsWith('+') ? countryCode : '+' + countryCode;
      rawPhone = `${dialPrefix}${rawPhone.replace(/\D/g, '')}`;
    }

    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw ApiError.badRequest('Mobile phone number must contain between 7 and 15 valid digits.', 'INVALID_PHONE_LENGTH');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw ApiError.badRequest('Password is required and must be at least 6 characters long.', 'INVALID_PASSWORD');
    }

    if (password.length > 128) {
      throw ApiError.badRequest('Password cannot exceed 128 characters.', 'INVALID_PASSWORD');
    }

    return {
      name: finalName,
      email: cleanEmail,
      phone: rawPhone,
      password
    };

  },

  /**
   * Validate user login payload.
   * @param {object} payload 
   * @returns {{ identifier: string, password: string, rememberMe: boolean }}
   */
  validateLogin(payload) {
    if (!payload || typeof payload !== 'object') {
      throw ApiError.badRequest('Request body must be a valid JSON object.', 'INVALID_PAYLOAD');
    }

    const { identifier, email, phone, password, rememberMe } = payload;
    const cleanIdentifier = (identifier || email || phone || '').trim();

    if (!cleanIdentifier) {
      throw ApiError.badRequest('Email address or mobile phone number is required.', 'MISSING_IDENTIFIER');
    }

    if (!password || typeof password !== 'string') {
      throw ApiError.badRequest('Password is required.', 'MISSING_PASSWORD');
    }

    return {
      identifier: cleanIdentifier,
      password,
      rememberMe: Boolean(rememberMe)
    };
  }
};

