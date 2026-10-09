import { InitiativeRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const initiativeRepo = new InitiativeRepository();

export const initiativesController = {
  async getPublicList(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 20, 10);
      const result = await initiativeRepo.findPublished({ page, limit });
      res.json({
        success: true,
        data: result.items,
        meta: { pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  async getPublicBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const initiative = await initiativeRepo.findBySlug(slug);
      if (!initiative || initiative.status !== 'published') {
        throw ApiError.notFound('Initiative not found.');
      }
      res.json({
        success: true,
        data: initiative,
      });
    } catch (err) {
      next(err);
    }
  },

  async createAdmin(req, res, next) {
    try {
      const { title, slug, summary, body, coverMediaAssetId, status } = req.body;
      if (!title || !slug || !summary || !body) {
        throw ApiError.badRequest('title, slug, summary, and body are required.');
      }
      const existing = await initiativeRepo.findBySlug(slug);
      if (existing) {
        throw ApiError.conflict(`Initiative with slug '${slug}' already exists.`);
      }
      const created = await initiativeRepo.create({
        title,
        slug,
        summary,
        body,
        cover_media_asset_id: coverMediaAssetId || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date() : null,
      });
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { title, summary, body, coverMediaAssetId, status } = req.body;
      const initiative = await initiativeRepo.findById(id);
      if (!initiative) {
        throw ApiError.notFound('Initiative not found.');
      }
      const updated = await initiativeRepo.update(id, {
        title,
        summary,
        body,
        cover_media_asset_id: coverMediaAssetId,
        status,
        published_at: status === 'published' && !initiative.published_at ? new Date() : initiative.published_at,
      });
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
