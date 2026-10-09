// @intent JSDoc type definitions for User Authentication module.

/**
 * @typedef {Object} UserAuthProfile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string|null} phone
 * @property {string} role - 'donor' | 'volunteer' | 'member'
 * @property {string} status - 'active' | 'suspended'
 * @property {string|null} lastLoginAt
 * @property {string} createdAt
 */

/**
 * @typedef {Object} UserSignUpPayload
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} password
 * @property {'donor'|'volunteer'|'member'} [role]
 */

/**
 * @typedef {Object} UserLoginPayload
 * @property {string} identifier - Email or mobile phone number
 * @property {string} password
 * @property {'donor'|'volunteer'|'member'} [role]
 * @property {boolean} [rememberMe]
 */

export {};
