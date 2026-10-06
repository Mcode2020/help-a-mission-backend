import { Router } from 'express';
import { adminRbacController } from './admin-rbac.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/permissions', requirePermission('rbac:read'), adminRbacController.getPermissions);
router.get('/roles', requirePermission('rbac:read'), adminRbacController.getRoles);
router.post('/roles', requirePermission('rbac:write'), adminRbacController.createRole);
router.patch('/roles/:id', requirePermission('rbac:write'), adminRbacController.updateRole);
router.delete('/roles/:id', requirePermission('rbac:write'), adminRbacController.deleteRole);
router.put('/accounts/:id/roles', requirePermission('rbac:assign'), adminRbacController.assignAccountRoles);

export default router;
