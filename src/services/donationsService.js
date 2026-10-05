import crypto from 'node:crypto';
import { createPaymentOrder, verifyPaymentSignature } from '../payment/razorpay.js';
import { logger } from '../security/logger.js';

// In-memory data store with fallback for development and test suites
const donationsStore = new Map();

/**
 * Creates a donation record and initiates a Razorpay order
 */
export async function createDonation({
  amount,
  donorName,
  email,
  phone,
  pan = '',
  frequency = 'once',
  campaignId = 'general',
}) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount < 10) {
    throw new Error('Minimum donation amount is ₹10.');
  }

  if (!donorName || !email) {
    throw new Error('Donor name and email are required.');
  }

  const receiptId = `HAM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const orderResult = await createPaymentOrder({
    amountInRupees: numAmount,
    receiptId,
    notes: {
      donorName,
      email,
      campaignId,
      frequency,
      pan: pan || 'N/A',
    },
  });

  const donationRecord = {
    id: receiptId,
    receiptId,
    amount: numAmount,
    donorName,
    email,
    phone: phone || '',
    pan: pan ? pan.toUpperCase() : '',
    frequency,
    campaignId,
    orderId: orderResult.orderId,
    status: 'created',
    createdAt: new Date().toISOString(),
    taxExemption80G: Boolean(pan),
  };

  donationsStore.set(receiptId, donationRecord);
  logger.info('Donation order created', { receiptId, amount: numAmount, campaignId });

  return {
    donationId: receiptId,
    orderId: orderResult.orderId,
    amount: orderResult.amount,
    currency: orderResult.currency,
    keyId: orderResult.keyId,
    simulated: orderResult.simulated,
  };
}

/**
 * Verifies Razorpay payment signature and updates donation status
 */
export async function verifyDonation({
  donationId,
  orderId,
  paymentId,
  signature,
}) {
  const donation = donationsStore.get(donationId);
  if (!donation) {
    throw new Error('Donation record not found.');
  }

  const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!isValid) {
    donation.status = 'failed';
    logger.warn('Donation signature verification failed', { donationId, orderId });
    throw new Error('Invalid payment signature. Transaction verification failed.');
  }

  donation.status = 'captured';
  donation.paymentId = paymentId;
  donation.capturedAt = new Date().toISOString();
  donation.certificate80G = `80G-HAM-${new Date().getFullYear()}-${donationId.slice(-6)}`;

  logger.info('Donation payment successfully captured', {
    donationId,
    paymentId,
    certificate80G: donation.certificate80G,
  });

  return {
    status: 'success',
    message: 'Thank you for your donation! Payment verified successfully.',
    receipt: {
      receiptNumber: donation.receiptId,
      donorName: donation.donorName,
      email: donation.email,
      amount: donation.amount,
      frequency: donation.frequency,
      paymentId: donation.paymentId,
      date: donation.capturedAt,
      certificate80G: donation.certificate80G,
      organization: 'Help-A-Mission Welfare Society JIND (Regd. No. 01667)',
    },
  };
}
