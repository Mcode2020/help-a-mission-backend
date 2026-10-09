// @intent User Authentication service handling signup, login, session token issuance, password hashing, and user profile management.
import { userRepository } from '../../database/repositories/user.repo.js';
import { userSessionRepository } from '../../database/repositories/user-session.repo.js';
import { hashPassword, verifyPassword, generateSessionToken, hashSessionToken } from '../../utils/crypto.js';
import { ApiError } from '../../utils/api-error.js';

const SESSION_DURATION_DEFAULT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_DURATION_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const userAuthService = {
  /**
   * Register a new user account with hashed password and initial session.
   * @param {object} params 
   * @returns {Promise<{ user: object, rawToken: string, expiresAt: Date }>}
   */
  async signUp({ name, email, phone, password, userAgent, ipAddress }) {
    const emailNormalized = email.toLowerCase().trim();
    const phoneNormalized = phone ? phone.trim() : null;

    // SECURITY: Check if account already exists by email
    const existingUserByEmail = await userRepository.findByEmailNormalized(emailNormalized);
    if (existingUserByEmail) {
      // SECURITY: Generic duplicate message to avoid user enumeration where required, or clear error for signup
      throw ApiError.conflict('An account with this email address already exists. Please log in instead.', 'EMAIL_ALREADY_EXISTS');
    }

    // SECURITY: Check if account already exists by phone
    if (phoneNormalized) {
      const existingUserByPhone = await userRepository.findByPhoneNormalized(phoneNormalized);
      if (existingUserByPhone) {
        throw ApiError.conflict('An account with this phone number already exists.', 'PHONE_ALREADY_EXISTS');
      }
    }

    // SECURITY: Hash password using Argon2id
    const passwordHash = await hashPassword(password);

    // Create user in PostgreSQL database
    const newUser = await userRepository.createUserWithAuth({
      name,
      email,
      phone,
      passwordHash,
      createdSource: 'signup'
    });

    // Generate secure session token
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DEFAULT_MS);

    // Create session in database
    await userSessionRepository.create({
      user_id: newUser.id,
      session_token_hash: tokenHash,
      device_id: 'web-client',
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
      expires_at: expiresAt
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        status: newUser.status,
        createdAt: newUser.created_at
      },
      rawToken,
      expiresAt
    };
  },

  /**
   * Authenticate user with identifier (email/phone) and password.
   * @param {object} params 
   * @returns {Promise<{ user: object, rawToken: string, expiresAt: Date }>}
   */
  async login({ identifier, password, rememberMe, userAgent, ipAddress }) {
    // 1. Find user by email or phone
    const user = await userRepository.findByIdentifier(identifier);

    if (!user || user.status !== 'active') {
      throw ApiError.unauthorized('Invalid email/phone or password.', 'INVALID_CREDENTIALS');
    }

    // If user was created via donation without password, allow account password setup error
    if (!user.password_hash) {
      throw ApiError.unauthorized('Account has no password set. Please reset your password or sign up.', 'NO_PASSWORD_SET');
    }

    // 2. SECURITY: Verify password hash using Argon2id
    const isValidPassword = await verifyPassword(user.password_hash, password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email/phone or password.', 'INVALID_CREDENTIALS');
    }

    // 3. Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // 4. Generate raw token and store SHA-256 hash in database
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    const sessionDurationMs = rememberMe ? SESSION_DURATION_REMEMBER_MS : SESSION_DURATION_DEFAULT_MS;
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    await userSessionRepository.create({
      user_id: user.id,
      session_token_hash: tokenHash,
      device_id: 'web-client',
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
      expires_at: expiresAt
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.last_login_at || new Date().toISOString(),
        createdAt: user.created_at
      },
      rawToken,
      expiresAt
    };
  },

  /**
   * Invalidate current user session token.
   * @param {string} rawToken 
   */
  async logout(rawToken) {
    if (!rawToken) return;
    const tokenHash = hashSessionToken(rawToken);
    await userSessionRepository.revokeByTokenHash(tokenHash);
  },

  /**
   * Retrieve active authenticated user profile by ID.
   * @param {string} userId 
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user || user.status !== 'active') {
      throw ApiError.notFound('User account not found or inactive.', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    };
  }
};

