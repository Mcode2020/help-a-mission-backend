import { Router } from 'express';
import { initiativesController } from './initiatives.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

// Public routes
router.get('/public/initiatives', initiativesController.getPublicList);
router.get('/public/initiatives/:slug', initiativesController.getPublicBySlug);

// Admin routes
router.post('/admin/initiatives', authenticateAdmin, requirePermission('initiatives:write'), initiativesController.createAdmin);
router.patch('/admin/initiatives/:id', authenticateAdmin, requirePermission('initiatives:write'), initiativesController.updateAdmin);

export default router;
