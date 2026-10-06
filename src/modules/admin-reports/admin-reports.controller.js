import { DonationRepository, UserRepository, AuditEventRepository } from '../../database/repositories/index.js';
import { PrivateFileStorageService } from '../../services/file-storage.service.js';
import { ApiError } from '../../utils/api-error.js';

const donationRepo = new DonationRepository();
const userRepo = new UserRepository();
const auditRepo = new AuditEventRepository();

export const adminReportsController = {
  /**
   * GET /api/v1/admin/dashboard
   */
  async getDashboardSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await donationRepo.getFinancialSummary({ startDate, endDate });

      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/donors
   */
  async getDonors(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 20, 10);

      const donors = await userRepo.findAll({ page, limit });
      res.json({
        success: true,
        data: donors.items,
        meta: { pagination: donors.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/donations
   */
  async getDonations(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 20, 10);

      const donations = await donationRepo.findAll({ page, limit });
      res.json({
        success: true,
        data: donations.items,
        meta: { pagination: donations.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/audit
   */
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 20, 10);

      const logs = await auditRepo.findAll({ page, limit, orderBy: 'created_at', order: 'desc' });
      res.json({
        success: true,
        data: logs.items,
        meta: { pagination: logs.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/admin/reports/export
   */
  async exportReport(req, res, next) {
    try {
      const { format = 'csv', startDate, endDate } = req.body;
      const summary = await donationRepo.getFinancialSummary({ startDate, endDate });

      const csvContent = `Gross Amount (paise),Refund Amount (paise),Net Amount (paise),Total Count,Unique Donors\n${summary.grossAmountMinor},${summary.refundAmountMinor},${summary.netAmountMinor},${summary.totalSuccessfulCount},${summary.uniqueDonorsCount}\n`;
      const buffer = Buffer.from(csvContent, 'utf8');

      const savedMeta = await PrivateFileStorageService.saveFile({
        buffer,
        originalName: `financial_report_${Date.now()}.${format}`,
        mimeType: 'text/csv',
        subfolder: 'reports',
      });

      await auditRepo.logEvent({
        requestId: req.requestId || 'system',
        actorType: 'admin',
        actorId: req.admin.id,
        action: 'report_export_generated',
        entityType: 'report',
        afterRedacted: { format, relativePath: savedMeta.relativePath },
      });

      res.status(201).json({
        success: true,
        message: 'Financial report generated successfully.',
        data: savedMeta,
      });
    } catch (err) {
      next(err);
    }
  },
};
