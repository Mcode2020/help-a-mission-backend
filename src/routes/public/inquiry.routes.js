import { Router } from 'express';
import { createContactInquiry, createVolunteerApplication } from '../../controllers/inquiryController.js';
import { submissionLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/contact', submissionLimiter, createContactInquiry);
router.post('/volunteer', submissionLimiter, createVolunteerApplication);

export default router;
