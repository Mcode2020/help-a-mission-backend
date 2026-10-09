// @intent Express middleware to authenticate end-user sessions via cookie or Bearer token header.
import { ApiError } from '../utils/api-error.js';
import { userSessionRepository } from '../database/repositories/user-session.repo.js';
import { hashSessionToken } from '../utils/crypto.js';

/**
 * Express middleware to validate user session and attach req.user and req.userSession.
 */
export async function authenticateUser(req, res, next) {
  try {
    let token = req.cookies ? req.cookies.user_session : null;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Session')) {
        token = parts[1];
      }
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Session token missing.', 'MISSING_SESSION_TOKEN');
    }

    const tokenHash = hashSessionToken(token);
    const sessionData = await userSessionRepository.findValidByTokenHash(tokenHash);

    if (!sessionData) {
      throw ApiError.unauthorized('Invalid, expired, or terminated user session.', 'INVALID_SESSION');
    }

    // Update last_seen_at timestamp asynchronously
    userSessionRepository.updateLastSeen(sessionData.id).catch(() => {});

    req.user = {
      id: sessionData.user_id,
      email: sessionData.email,
      name: sessionData.name,
      phone: sessionData.phone,
      role: sessionData.role,
      status: sessionData.user_status,
    };

    req.userSession = {
      id: sessionData.id,
      expiresAt: sessionData.expires_at,
      rawToken: token,
    };

    next();
  } catch (error) {
    next(error);
  }
}
