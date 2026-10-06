import { listCampaigns, getCampaignBySlug } from '../services/campaignsService.js';

export async function handleGetCampaigns(req, res, next) {
  try {
    const campaigns = await listCampaigns();
    res.status(200).json({
      status: 'success',
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetCampaignBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const campaign = await getCampaignBySlug(slug);

    if (!campaign) {
      return res.status(404).json({
        status: 'error',
        message: `Campaign not found for slug: ${slug}`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}
