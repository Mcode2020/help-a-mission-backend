import { Router } from 'express';
import multer from 'multer';
import { mediaController } from './media.controller.js';
import { authenticateAdmin } from '../../middleware/authenticate-admin.js';
import { requirePermission } from '../../middleware/authorize.js';

const uploadMiddleware = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  storage: multer.memoryStorage(),
});

const router = Router();

router.get('/admin/media', authenticateAdmin, requirePermission('media:read'), mediaController.list);
router.post('/admin/media/upload', authenticateAdmin, requirePermission('media:write'), uploadMiddleware.single('file'), mediaController.upload);
router.get('/admin/private-files/:id', authenticateAdmin, requirePermission('files:private_read'), mediaController.streamPrivateFile);

export default router;
