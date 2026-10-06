import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Hashes a raw password string using Argon2id.
 * @param {string} password 
 * @returns {Promise<string>} Argon2id password hash
 */
export async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1
  });
}

/**
 * Verifies a plain text password against an Argon2id password hash.
 * @param {string} hash 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

/**
 * Generates a cryptographically secure random session token (64 hex characters).
 * @returns {string} Raw session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes SHA-256 hash of a session token for secure database storage.
 * @param {string} token - Raw session token
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashSessionToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}
