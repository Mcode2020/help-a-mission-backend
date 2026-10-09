import { Router } from 'express';
import { adminReportsController } from './admin-reports.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

// SECURITY: Limit admin authentication middleware to /admin paths only so public endpoints on shared /api/v1 router prefix pass through without requiring session token (OWASP A01:2021-Broken Access Control).
router.use('/admin', authenticateAdmin);

router.get('/admin/dashboard', requirePermission('reports:read'), adminReportsController.getDashboardSummary);
router.get('/admin/donors', requirePermission('donors:read'), adminReportsController.getDonors);
router.get('/admin/donations', requirePermission('donations:read'), adminReportsController.getDonations);
router.get('/admin/audit', requirePermission('security:read'), adminReportsController.getAuditLogs);
router.post('/admin/reports/export', requirePermission('reports:export'), adminReportsController.exportReport);

export default router;
