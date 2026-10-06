import { adminAuthRepository } from './admin-auth.repository.js';
import { verifyPassword, generateSessionToken, hashSessionToken } from '../../utils/crypto.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';

export const adminAuthService = {
  /**
   * Authenticate admin email & password and issue server-side session token.
   * @param {object} params 
   * @param {string} params.email 
   * @param {string} params.password 
   * @param {string} [params.userAgent] 
   * @param {string} [params.ipAddress] 
   * @returns {Promise<{ admin: object, rawToken: string, expiresAt: Date }>}
   */
  async login({ email, password, userAgent, ipAddress }) {
    // 1. Find admin record by email
    const admin = await adminAuthRepository.findAdminByEmail(email);

    if (!admin || admin.status !== 'active') {
      throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // 2. Verify password hash using Argon2id
    const isValidPassword = await verifyPassword(admin.password_hash, password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // 3. Generate secure raw session token & SHA-256 reference hash
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    // 4. Calculate session expiration date
    const expiresAt = new Date(Date.now() + env.ADMIN_SESSION_MAX_AGE_MS);

    // 5. Persist session in PostgreSQL database
    await adminAuthRepository.createSession({
      adminId: admin.id,
      sessionTokenHash: tokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt
    });

    // 6. Update last_login_at timestamp
    await adminAuthRepository.updateAdminLastLogin(admin.id);

    // 7. Fetch full admin details with role & aggregated permissions
    const fullAdmin = await adminAuthRepository.findAdminById(admin.id);

    return {
      admin: {
        id: fullAdmin.id,
        email: fullAdmin.email,
        role: fullAdmin.role_name,
        permissions: fullAdmin.permissions || [],
        lastLoginAt: fullAdmin.last_login_at
      },
      rawToken,
      expiresAt
    };
  },

  /**
   * Refresh active admin session, extending expiration and issuing a new token.
   * @param {string} rawToken 
   * @param {string} [userAgent]
   * @param {string} [ipAddress]
   * @returns {Promise<{ admin: object, rawToken: string, expiresAt: Date }>}
   */
  async refresh(rawToken, userAgent, ipAddress) {
    if (!rawToken) {
      throw ApiError.unauthorized('Authentication required. Session token missing.', 'MISSING_SESSION_TOKEN');
    }

    const sessionData = await adminAuthRepository.findSessionForRefresh(hashSessionToken(rawToken));
    if (!sessionData) {
      throw ApiError.unauthorized('Invalid, expired, or revoked admin session.', 'INVALID_SESSION');
    }

    const newRawToken = generateSessionToken();
    const newTokenHash = hashSessionToken(newRawToken);
    const expiresAt = new Date(Date.now() + env.ADMIN_SESSION_MAX_AGE_MS);

    await adminAuthRepository.refreshSession({
      sessionId: sessionData.id,
      newTokenHash,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null
    });

    const fullAdmin = await adminAuthRepository.findAdminById(sessionData.admin_id);

    return {
      admin: {
        id: fullAdmin.id,
        email: fullAdmin.email,
        role: fullAdmin.role_name,
        permissions: fullAdmin.permissions || [],
        lastLoginAt: fullAdmin.last_login_at
      },
      rawToken: newRawToken,
      expiresAt
    };
  },

  /**
   * Invalidate current session (Logout).
   * @param {string} rawToken 
   */
  async logout(rawToken) {
    if (!rawToken) return;
    const tokenHash = hashSessionToken(rawToken);
    await adminAuthRepository.deleteSessionByTokenHash(tokenHash);
  },

  /**
   * Invalidate all active sessions for an admin (Logout all devices).
   * @param {string} adminId 
   */
  async logoutAll(adminId) {
    if (!adminId) return;
    await adminAuthRepository.deleteAllSessionsForAdmin(adminId);
  },

  /**
   * Retrieve current authenticated admin profile.
   * @param {string} adminId 
   * @returns {Promise<object>}
   */
  async getMe(adminId) {
    const admin = await adminAuthRepository.findAdminById(adminId);

    if (!admin || !admin.is_active) {
      throw ApiError.notFound('Admin profile not found or inactive.', 'ADMIN_NOT_FOUND');
    }

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role_name,
      permissions: admin.permissions || [],
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at
    };
  }
};
