import { Router } from 'express';
import publicHealthRoutes from './public/health.routes.js';
import publicDonationRoutes from './public/donations.routes.js';
import publicCampaignRoutes from './public/campaigns.routes.js';
import publicVolunteerRoutes from './public/volunteers.routes.js';
import publicContactRoutes from './public/contact.routes.js';

const router = Router();

// SECURITY: Public routes mounted explicitly under categorized sub-routers
router.use('/health', publicHealthRoutes);
router.use('/donations', publicDonationRoutes);
router.use('/campaigns', publicCampaignRoutes);
router.use('/volunteers', publicVolunteerRoutes);
router.use('/contact', publicContactRoutes);

export default router;
