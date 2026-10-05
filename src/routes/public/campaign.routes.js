import { Router } from 'express';
import { getCampaigns, getCampaignById, createCampaign } from '../../controllers/campaignController.js';

const router = Router();

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);

export default router;
