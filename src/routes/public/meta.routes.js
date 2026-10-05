import { Router } from 'express';
import { getTeam, getImpact } from '../../controllers/metaController.js';

const router = Router();

router.get('/team', getTeam);
router.get('/impact', getImpact);

export default router;
