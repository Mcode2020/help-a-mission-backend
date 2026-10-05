import { Router } from 'express';
import publicHealthRoutes from './public/health.routes.js';

const router = Router();

// SECURITY: Public routes mounted explicitly on dedicated public router
router.use('/health', publicHealthRoutes);

export default router;
