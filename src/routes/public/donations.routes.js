import { Router } from 'express';
import { handleCreateDonation, handleVerifyDonation } from '../../controllers/donationsController.js';

const router = Router();

// Public Donation endpoints
router.post('/create-order', handleCreateDonation);
router.post('/verify', handleVerifyDonation);

export default router;
