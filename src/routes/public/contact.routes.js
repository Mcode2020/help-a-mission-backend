import { Router } from 'express';
import { handleContactInquiry } from '../../controllers/contactController.js';

const router = Router();

router.post('/', handleContactInquiry);

export default router;
