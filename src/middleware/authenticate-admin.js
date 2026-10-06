import { ApiError } from '../utils/api-error.js';
import { AdminModel } from '../database/models/admin.model.js';

/**
 * Express middleware to authenticate admin users via PostgreSQL server-side session token.
 */
export async function authenticateAdmin(req, res, next) {
  try {
    let token = req.cookies ? req.cookies.admin_session : null;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Session')) {
        token = parts[1];
      }
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Session cookie or token missing.', 'MISSING_SESSION_TOKEN');
    }

    const sessionData = await AdminModel.validateSession(token);

    if (!sessionData) {
      throw ApiError.unauthorized('Invalid, expired, or terminated admin session.', 'INVALID_SESSION');
    }

    req.admin = {
      id: sessionData.admin.id,
      email: sessionData.admin.email,
      authzVersion: sessionData.admin.authzVersion,
      permissions: Array.from(sessionData.permissions),
    };

    req.session = {
      id: sessionData.session.id,
      expiresAt: sessionData.session.expires_at,
      rawToken: token,
    };

    next();
  } catch (error) {
    next(error);
  }
}
