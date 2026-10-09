import { Router } from 'express';
import { galleryController } from './gallery.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

// Public routes
router.get('/public/gallery', galleryController.getPublicGallery);

// Admin routes
router.post('/admin/gallery', authenticateAdmin, requirePermission('gallery:write'), galleryController.createAdminItem);

export default router;
