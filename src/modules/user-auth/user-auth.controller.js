// @intent Express controller for user authentication (signup, login, logout, get profile).
import { userAuthValidation } from './user-auth.validation.js';
import { userAuthService } from './user-auth.service.js';
import { env } from '../../config/env.js';

/**
 * Cookie options helper for user_session cookie.
 * @param {Date} expiresAt 
 */
function getCookieOptions(expiresAt) {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    expires: expiresAt,
    path: '/'
  };
}

export const userAuthController = {
  /**
   * User registration endpoint handler.
   */
  async signUp(req, res, next) {
    try {
      const validated = userAuthValidation.validateSignUp(req.body);
      const userAgent = req.get('user-agent') || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const { user, rawToken, expiresAt } = await userAuthService.signUp({
        ...validated,
        userAgent,
        ipAddress
      });

      // SECURITY: Set HttpOnly session cookie
      res.cookie('user_session', rawToken, getCookieOptions(expiresAt));

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
          user,
          token: rawToken,
          expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User login endpoint handler.
   */
  async login(req, res, next) {
    try {
      const validated = userAuthValidation.validateLogin(req.body);
      const userAgent = req.get('user-agent') || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const { user, rawToken, expiresAt } = await userAuthService.login({
        ...validated,
        userAgent,
        ipAddress
      });

      // SECURITY: Set HttpOnly session cookie
      res.cookie('user_session', rawToken, getCookieOptions(expiresAt));

      return res.json({
        success: true,
        message: 'Welcome back! Login successful.',
        data: {
          user,
          token: rawToken,
          expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User logout endpoint handler.
   */
  async logout(req, res, next) {
    try {
      let token = req.cookies ? req.cookies.user_session : null;
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Session')) {
          token = parts[1];
        }
      }

      if (token) {
        await userAuthService.logout(token);
      }

      // Clear session cookie
      res.clearCookie('user_session', { path: '/' });

      return res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current authenticated user profile endpoint handler.
   */
  async getMe(req, res, next) {
    try {
      const user = await userAuthService.getMe(req.user.id);
      return res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
};
