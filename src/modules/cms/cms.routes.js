import { Router } from 'express';
import { cmsController } from './cms.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

// Admin CMS endpoints
router.get('/admin/cms/pages/:slug', authenticateAdmin, requirePermission('cms:read'), cmsController.getAdminPage);
router.put('/admin/cms/pages/:slug/sections', authenticateAdmin, requirePermission('cms:write'), cmsController.updatePageSections);

export default router;
