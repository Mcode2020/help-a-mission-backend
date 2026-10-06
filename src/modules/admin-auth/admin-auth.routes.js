import { Router } from 'express';
import { adminAuthController } from './admin-auth.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';

const router = Router();

/**
 * @route   POST /api/v1/admin/auth/login
 * @desc    Authenticate admin user and establish session cookie
 * @access  Public
 */
router.post('/login', adminAuthController.login);

/**
 * @route   POST /api/v1/admin/auth/refresh
 * @desc    Refresh current admin session token and extend cookie expiration
 * @access  Private (Admin)
 */
router.post('/refresh', adminAuthController.refresh);

/**
 * @route   POST /api/v1/admin/auth/logout
 * @desc    Terminate current admin session & clear cookie
 * @access  Private (Admin)
 */
router.post('/logout', authenticateAdmin, adminAuthController.logout);

/**
 * @route   POST /api/v1/admin/auth/logout-all
 * @desc    Terminate all active admin sessions across devices
 * @access  Private (Admin)
 */
router.post('/logout-all', authenticateAdmin, adminAuthController.logoutAll);

/**
 * @route   GET /api/v1/admin/auth/me
 * @desc    Get currently authenticated admin profile and permissions
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, adminAuthController.me);

export default router;
