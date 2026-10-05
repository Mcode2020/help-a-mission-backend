import { getDb } from '../config/db.js';
import { INITIAL_CAMPAIGNS } from '../data/initialData.js';
import { logger } from '../security/logger.js';
import { sanitizeString } from '../middleware/validate.js';

/**
 * GET /api/campaigns
 * Retrieves list of active campaigns with optional category/featured filtering
 */
export async function getCampaigns(req, res, next) {
  try {
    const { category, featured, urgent } = req.query;
    let campaigns = [];

    try {
      const db = getDb();
      const query = {};
      if (category) query.category = category;
      if (featured === 'true') query.featured = true;
      if (urgent === 'true') query.urgent = true;

      campaigns = await db.collection('campaigns').find(query).toArray();
    } catch {
      logger.info('Using initial campaigns fallback (Database not connected or collection empty).');
      campaigns = [...INITIAL_CAMPAIGNS];

      if (category) {
        campaigns = campaigns.filter(c => c.category.toLowerCase() === String(category).toLowerCase());
      }
      if (featured === 'true') {
        campaigns = campaigns.filter(c => c.featured);
      }
      if (urgent === 'true') {
        campaigns = campaigns.filter(c => c.urgent);
      }
    }

    res.json({
      status: 'success',
      count: campaigns.length,
      data: campaigns
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/campaigns/:id
 * Retrieves campaign details by ID
 */
export async function getCampaignById(req, res, next) {
  try {
    const { id } = req.params;
    let campaign = null;

    try {
      const db = getDb();
      campaign = await db.collection('campaigns').findOne({ id });
    } catch {
      campaign = INITIAL_CAMPAIGNS.find(c => c.id === id);
    }

    if (!campaign) {
      res.status(404).json({
        status: 'error',
        message: `Campaign with ID "${id}" not found.`
      });
      return;
    }

    res.json({
      status: 'success',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/campaigns
 * Creates a new campaign
 */
export async function createCampaign(req, res, next) {
  try {
    const { title, category, summary, fullStory, targetAmount, image, budgetBreakdown, urgent, featured } = req.body;

    if (!title || !category || !summary || !targetAmount) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: title, category, summary, and targetAmount are required.'
      });
      return;
    }

    const parsedTarget = Number(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'targetAmount must be a positive number.'
      });
      return;
    }

    const newCampaign = {
      id: `camp-${Date.now()}`,
      title: sanitizeString(title),
      category: sanitizeString(category),
      summary: sanitizeString(summary),
      fullStory: sanitizeString(fullStory || summary),
      targetAmount: parsedTarget,
      raisedAmount: 0,
      donorsCount: 0,
      daysLeft: 30,
      image: sanitizeString(image || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'),
      urgent: Boolean(urgent),
      featured: Boolean(featured),
      budgetBreakdown: Array.isArray(budgetBreakdown) ? budgetBreakdown : [],
      createdAt: new Date().toISOString()
    };

    try {
      const db = getDb();
      await db.collection('campaigns').insertOne(newCampaign);
    } catch {
      INITIAL_CAMPAIGNS.unshift(newCampaign);
    }

    logger.info('New campaign created successfully', { id: newCampaign.id, title: newCampaign.title });

    res.status(201).json({
      status: 'success',
      message: 'Campaign created successfully',
      data: newCampaign
    });
  } catch (err) {
    next(err);
  }
}
