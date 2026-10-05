import { Router } from 'express';
import { handleGetCampaigns, handleGetCampaignBySlug } from '../../controllers/campaignsController.js';

const router = Router();

// Public Campaign routes
router.get('/', handleGetCampaigns);
router.get('/:slug', handleGetCampaignBySlug);

export default router;
