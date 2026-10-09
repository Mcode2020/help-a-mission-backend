import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const parsePositiveInt = (val) => {
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/help_a_mission_db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_cookie_secret_super_secure_random_key_12345',
  ADMIN_SESSION_MAX_AGE_MINUTES: parsePositiveInt(process.env.ADMIN_SESSION_MAX_AGE_MINUTES),
  ADMIN_SESSION_MAX_AGE_DAYS: parsePositiveInt(process.env.ADMIN_SESSION_MAX_AGE_DAYS) || 7,
  get ADMIN_SESSION_MAX_AGE_MS() {
    if (this.ADMIN_SESSION_MAX_AGE_MINUTES) {
      return this.ADMIN_SESSION_MAX_AGE_MINUTES * 60 * 1000;
    }
    return this.ADMIN_SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  }
};

/**
 * Validates mandatory environment variables at server startup.
 * Throws explicit error if configuration is invalid or missing in production.
 */
export function validateEnv() {
  const missing = [];

  if (env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET === 'dev_cookie_secret_super_secure_random_key_12345') {
      missing.push('COOKIE_SECRET (a strong secret must be specified in production)');
    }
  }

  if (missing.length > 0) {
    throw new Error(`CRITICAL: Missing or invalid environment configurations: ${missing.join(', ')}`);
  }
}
