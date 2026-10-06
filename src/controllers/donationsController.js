import { createDonation, verifyDonation } from '../services/donationsService.js';

/**
 * Controller: Initiate donation order
 * POST /api/donations/create-order
 */
export async function handleCreateDonation(req, res, next) {
  try {
    const { amount, donorName, email, phone, pan, frequency, campaignId } = req.body;

    const result = await createDonation({
      amount,
      donorName,
      email,
      phone,
      pan,
      frequency,
      campaignId,
    });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Verify donation payment
 * POST /api/donations/verify
 */
export async function handleVerifyDonation(req, res, next) {
  try {
    const { donationId, orderId, paymentId, signature } = req.body;

    const result = await verifyDonation({
      donationId,
      orderId,
      paymentId,
      signature,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
