import { Router } from 'express';
import publicHealthRoutes from './public/health.routes.js';
import publicCampaignRoutes from './public/campaign.routes.js';
import publicDonationRoutes from './public/donation.routes.js';
import publicInquiryRoutes from './public/inquiry.routes.js';
import publicMetaRoutes from './public/meta.routes.js';

const router = Router();

// SECURITY: Dedicated public module routes allow-list
router.use('/health', publicHealthRoutes);
router.use('/campaigns', publicCampaignRoutes);
router.use('/donations', publicDonationRoutes);
router.use('/inquiries', publicInquiryRoutes);
router.use('/', publicMetaRoutes);

export default router;
