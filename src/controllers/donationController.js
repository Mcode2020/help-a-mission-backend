import { getDb } from '../config/db.js';
import { logger } from '../security/logger.js';
import { sanitizeString, isValidEmail, isValidPan, isValidPhone } from '../middleware/validate.js';
import { INITIAL_CAMPAIGNS } from '../data/initialData.js';

const mockDonationStore = [];

/**
 * POST /api/donations
 * Process donation record, validate input, update campaign metrics
 */
export async function createDonation(req, res, next) {
  try {
    const {
      donorName,
      email,
      phone,
      amount,
      campaignId,
      panNumber,
      isAnonymous,
      paymentMethod,
      requires80G
    } = req.body;

    // Validation
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      res.status(400).json({
        status: 'error',
        message: 'Donation amount must be at least ₹10.'
      });
      return;
    }

    if (!email || !isValidEmail(email)) {
      res.status(400).json({
        status: 'error',
        message: 'A valid email address is required for receipt generation.'
      });
      return;
    }

    if (phone && !isValidPhone(phone)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format provided.'
      });
      return;
    }

    if (requires80G && panNumber && !isValidPan(panNumber)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid Indian PAN card number format (Format: ABCDE1234F).'
      });
      return;
    }

    const cleanDonorName = isAnonymous ? 'Anonymous Donor' : sanitizeString(donorName || 'Anonymous Donor');
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const donation = {
      id: `don-${Date.now()}`,
      transactionId,
      donorName: cleanDonorName,
      email: email.trim().toLowerCase(),
      phone: phone ? sanitizeString(phone) : null,
      amount: parsedAmount,
      campaignId: campaignId ? sanitizeString(campaignId) : 'general',
      panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
      isAnonymous: Boolean(isAnonymous),
      paymentMethod: sanitizeString(paymentMethod || 'upi'),
      requires80G: Boolean(requires80G),
      status: 'SUCCESS',
      createdAt: new Date().toISOString()
    };

    // Attempt DB save & campaign update
    try {
      const db = getDb();
      await db.collection('donations').insertOne(donation);
      if (campaignId) {
        await db.collection('campaigns').updateOne(
          { id: campaignId },
          { $inc: { raisedAmount: parsedAmount, donorsCount: 1 } }
        );
      }
    } catch {
      mockDonationStore.unshift(donation);
      const targetCamp = INITIAL_CAMPAIGNS.find(c => c.id === campaignId);
      if (targetCamp) {
        targetCamp.raisedAmount += parsedAmount;
        targetCamp.donorsCount += 1;
      }
    }

    logger.info('Donation created successfully', {
      transactionId,
      amount: parsedAmount,
      campaignId: donation.campaignId
    });

    res.status(201).json({
      status: 'success',
      message: 'Thank you! Your donation has been recorded successfully.',
      data: {
        transactionId: donation.transactionId,
        amount: donation.amount,
        donorName: donation.donorName,
        campaignId: donation.campaignId,
        status: donation.status,
        receipt80GEligible: donation.requires80G
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/donations/recent
 * Retrieve recent public donations
 */
export async function getRecentDonations(req, res, next) {
  try {
    let donations = [];
    try {
      const db = getDb();
      donations = await db.collection('donations')
        .find({ status: 'SUCCESS' })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
    } catch {
      donations = [...mockDonationStore];
    }

    const publicDonations = donations.map(d => ({
      id: d.id,
      donorName: d.isAnonymous ? 'Anonymous Donor' : d.donorName,
      amount: d.amount,
      campaignId: d.campaignId,
      createdAt: d.createdAt
    }));

    res.json({
      status: 'success',
      count: publicDonations.length,
      data: publicDonations
    });
  } catch (err) {
    next(err);
  }
}
