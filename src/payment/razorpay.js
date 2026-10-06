import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../security/logger.js';

let razorpayClient = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  logger.info('Razorpay payment gateway initialized in LIVE/TEST mode.');
} else {
  logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing. Payment gateway operating in safe SIMULATION mode.');
}

/**
 * Creates an order on Razorpay or generates a valid simulated order token
 * @param {Object} params
 * @param {number} params.amountInRupees - Donation amount in INR
 * @param {string} params.receiptId - Internal donation tracking receipt
 * @param {Object} [params.notes] - Metadata
 * @returns {Promise<{ orderId: string, amount: number, currency: string, keyId: string, simulated: boolean }>}
 */
export async function createPaymentOrder({ amountInRupees, receiptId, notes = {} }) {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes,
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
        simulated: false,
      };
    } catch (err) {
      logger.error('Razorpay orders.create failed', { error: err.message });
      throw new Error(`Payment order creation failed: ${err.message}`);
    }
  }

  // Safe simulation fallback for local developer sandbox
  const simulatedOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: simulatedOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: 'rzp_test_simulated_key',
    simulated: true,
  };
}

/**
 * SECURITY: Timing-safe HMAC-SHA256 signature verification (CWE-208)
 * Verifies Razorpay payment signature
 * @param {Object} params
 * @param {string} params.orderId - razorpay_order_id
 * @param {string} params.paymentId - razorpay_payment_id
 * @param {string} params.signature - razorpay_signature
 * @returns {boolean}
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // Handle simulation mode verification using timingSafeEqual
  if (orderId.startsWith('order_sim_')) {
    const expectedSim = `sim_sig_${orderId}_${paymentId}`;
    const expSimBuf = Buffer.from(expectedSim, 'utf8');
    const actSimBuf = Buffer.from(signature, 'utf8');
    // SECURITY: timingSafeEqual — === leaks through response time how many leading bytes of a secret were guessed (CWE-208)
    return expSimBuf.length === actSimBuf.length && crypto.timingSafeEqual(expSimBuf, actSimBuf);
  }

  if (!env.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  // SECURITY: crypto.timingSafeEqual prevents timing attack side-channel leaks
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
