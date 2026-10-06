import { Router, raw } from 'express';
import { webhooksController } from './webhooks.controller.js';

const router = Router();

// Express raw body middleware preserves exact byte stream for HMAC SHA256 verification
router.post('/webhooks/razorpay', raw({ type: 'application/json' }), webhooksController.handleRazorpayWebhook);

export default router;
