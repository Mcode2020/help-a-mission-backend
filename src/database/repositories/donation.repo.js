import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class DonationRepository extends BaseRepository {
  constructor() {
    super('donations', false);
  }

  async findByRazorpayOrderId(orderId) {
    return await this.findOneWhere({ razorpay_order_id: orderId });
  }

  async findByRazorpayPaymentId(paymentId) {
    return await this.findOneWhere({ razorpay_payment_id: paymentId });
  }

  async getFinancialSummary({ startDate, endDate } = {}) {
    let qb = this.query().where('status', 'captured');

    if (startDate) {
      qb = qb.where('paid_at', '>=', startDate);
    }
    if (endDate) {
      qb = qb.where('paid_at', '<=', endDate);
    }

    const [stats] = await qb
      .select(
        db.raw('COALESCE(SUM(amount_minor), 0) as gross_amount_minor'),
        db.raw('COALESCE(SUM(refunded_amount_minor), 0) as refund_amount_minor'),
        db.raw('COUNT(id) as total_successful_count'),
        db.raw('COUNT(DISTINCT user_id) as unique_donors_count')
      );

    const gross = parseInt(stats.gross_amount_minor, 10);
    const refund = parseInt(stats.refund_amount_minor, 10);
    const count = parseInt(stats.total_successful_count, 10);
    const uniqueDonors = parseInt(stats.unique_donors_count, 10);

    return {
      grossAmountMinor: gross,
      refundAmountMinor: refund,
      netAmountMinor: gross - refund,
      totalSuccessfulCount: count,
      uniqueDonorsCount: uniqueDonors,
      averageDonationMinor: count > 0 ? Math.round(gross / count) : 0,
    };
  }
}

export default DonationRepository;
