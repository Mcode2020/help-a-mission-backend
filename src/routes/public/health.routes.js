import { Router } from 'express';
import { getHealthStatus } from '../../controllers/healthController.js';

// SECURITY: Public health check route — explicitly declared and isolated from private routes
const router = Router();

router.get('/', getHealthStatus);

export default router;
