/**
 * JSDoc Type Definitions for Admin Authentication Module
 */

/**
 * @typedef {Object} AdminProfile
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} role
 * @property {string[]} permissions
 * @property {string|null} [lastLoginAt]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} SessionRecord
 * @property {string} id
 * @property {string} adminId
 * @property {string} sessionTokenHash
 * @property {Date} expiresAt
 * @property {string} [userAgent]
 * @property {string} [ipAddress]
 */

/**
 * @typedef {Object} LoginResult
 * @property {AdminProfile} admin
 * @property {string} sessionToken
 * @property {Date} expiresAt
 */

export {};
