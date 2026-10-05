import { Router } from 'express';
import { createDonation, getRecentDonations } from '../../controllers/donationController.js';
import { submissionLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/', submissionLimiter, createDonation);
router.get('/recent', getRecentDonations);

export default router;
