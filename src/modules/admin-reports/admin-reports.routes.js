import { Router } from 'express';
import { adminReportsController } from './admin-reports.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/admin/dashboard', requirePermission('reports:read'), adminReportsController.getDashboardSummary);
router.get('/admin/donors', requirePermission('donors:read'), adminReportsController.getDonors);
router.get('/admin/donations', requirePermission('donations:read'), adminReportsController.getDonations);
router.get('/admin/audit', requirePermission('security:read'), adminReportsController.getAuditLogs);
router.post('/admin/reports/export', requirePermission('reports:export'), adminReportsController.exportReport);

export default router;
