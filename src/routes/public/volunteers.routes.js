import { Router } from 'express';
import { handleVolunteerApplication } from '../../controllers/volunteersController.js';

const router = Router();

router.post('/', handleVolunteerApplication);

export default router;
