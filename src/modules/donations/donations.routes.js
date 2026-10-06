import { Router } from 'express';
import { donationsController } from './donations.controller.js';

const router = Router();

router.post('/donations/order', donationsController.createOrder);
router.get('/donations/:id/status', donationsController.getStatus);

export default router;
