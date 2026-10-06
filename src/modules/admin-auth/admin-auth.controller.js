import { adminAuthService } from './admin-auth.service.js';
import { adminAuthValidation } from './admin-auth.validation.js';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'admin_session';

const getCookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  expires: expiresAt,
  path: '/'
});

export const adminAuthController = {
  /**
   * POST /api/v1/admin/auth/login
   */
  async login(req, res, next) {
    try {
      const validatedInput = adminAuthValidation.validateLogin(req.body);
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const { admin, rawToken, expiresAt } = await adminAuthService.login({
        email: validatedInput.email,
        password: validatedInput.password,
        userAgent,
        ipAddress
      });

      // Set secure HttpOnly session cookie
      res.cookie(COOKIE_NAME, rawToken, getCookieOptions(expiresAt));

      res.status(200).json({
        success: true,
        message: 'Admin authentication successful.',
        data: {
          admin,
          token: rawToken,
          expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      let rawToken = req.cookies ? req.cookies[COOKIE_NAME] : null;

      if (!rawToken && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Session')) {
          rawToken = parts[1];
        }
      }

      if (!rawToken && req.body && req.body.token) {
        rawToken = req.body.token;
      }

      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const { admin, rawToken: newRawToken, expiresAt } = await adminAuthService.refresh(
        rawToken,
        userAgent,
        ipAddress
      );

      // Set refreshed secure HttpOnly session cookie
      res.cookie(COOKIE_NAME, newRawToken, getCookieOptions(expiresAt));

      res.status(200).json({
        success: true,
        message: 'Admin session refreshed successfully.',
        data: {
          admin,
          token: newRawToken,
          expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/auth/logout
   */
  async logout(req, res, next) {
    try {
      const rawToken = (req.cookies && req.cookies[COOKIE_NAME]) || (req.session && req.session.rawToken);

      if (rawToken) {
        await adminAuthService.logout(rawToken);
      }

      // Clear session cookie
      res.clearCookie(COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      const adminId = req.admin.id;

      await adminAuthService.logoutAll(adminId);

      // Clear session cookie
      res.clearCookie(COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.status(200).json({
        success: true,
        message: 'All active admin sessions terminated successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/auth/me
   */
  async me(req, res, next) {
    try {
      const adminProfile = await adminAuthService.getMe(req.admin.id);

      res.status(200).json({
        success: true,
        data: {
          admin: adminProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
