import crypto from 'node:crypto';
import { DonationRepository, UserRepository, JobRepository } from '../../database/repositories/index.js';
import { withTransaction } from '../../database/db.transaction.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';

const donationRepo = new DonationRepository();
const userRepo = new UserRepository();
const jobRepo = new JobRepository();

export const donationsController = {
  /**
   * POST /api/v1/donations/order
   */
  async createOrder(req, res, next) {
    try {
      const { amountMinor, currency = 'INR', donorName, donorEmail, donorPhone, message } = req.body;

      if (!amountMinor || amountMinor < 1000) { // minimum ₹10.00
        throw ApiError.badRequest('amountMinor must be at least 1000 paise (₹10.00).');
      }

      if (!donorName || !donorEmail) {
        throw ApiError.badRequest('donorName and donorEmail are required.');
      }

      const idempotencyKey = req.headers['idempotency-key'];
      if (idempotencyKey) {
        const existingOrder = await donationRepo.findOneWhere({ razorpay_order_id: `order_idemp_${idempotencyKey}` });
        if (existingOrder) {
          return res.json({
            success: true,
            data: {
              donationId: existingOrder.id,
              razorpayOrderId: existingOrder.razorpay_order_id,
              amountMinor: parseInt(existingOrder.amount_minor, 10),
              currency: existingOrder.currency,
              keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
            },
          });
        }
      }

      // Generate order reference
      const simulatedOrderId = idempotencyKey ? `order_idemp_${idempotencyKey}` : `order_${crypto.randomBytes(8).toString('hex')}`;

      const donation = await withTransaction(async (trx) => {
        const user = await userRepo.upsertFromDonation({
          email: donorEmail,
          name: donorName,
          phone: donorPhone,
        });

        return await donationRepo.create(
          {
            user_id: user.id,
            amount_minor: amountMinor,
            currency,
            status: 'order_created',
            message: message || null,
            razorpay_order_id: simulatedOrderId,
          },
          trx
        );
      });

      res.status(201).json({
        success: true,
        data: {
          donationId: donation.id,
          razorpayOrderId: donation.razorpay_order_id,
          amountMinor: parseInt(donation.amount_minor, 10),
          currency: donation.currency,
          keyId: env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/donations/:id/status
   */
  async getStatus(req, res, next) {
    try {
      const { id } = req.params;
      const donation = await donationRepo.findById(id);

      if (!donation) {
        throw ApiError.notFound('Donation record not found.');
      }

      res.json({
        success: true,
        data: {
          donationId: donation.id,
          status: donation.status,
          amountMinor: parseInt(donation.amount_minor, 10),
          paidAt: donation.paid_at,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
