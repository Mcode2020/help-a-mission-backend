import { Router } from 'express';
import { membersController } from './members.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

// Public routes
router.get('/public/members', membersController.getPublicMembers);

// Admin routes
router.get('/admin/members', authenticateAdmin, requirePermission('members:read'), membersController.getAdminMembers);
router.get('/admin/members/:id', authenticateAdmin, requirePermission('members:read'), membersController.getMemberById);
router.post('/admin/members', authenticateAdmin, requirePermission('members:write'), membersController.createMember);
router.patch('/admin/members/:id', authenticateAdmin, requirePermission('members:write'), membersController.updateMember);
router.delete('/admin/members/:id', authenticateAdmin, requirePermission('members:write'), membersController.deleteMember);

export default router;
