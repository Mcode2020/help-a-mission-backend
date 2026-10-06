import { GalleryRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const galleryRepo = new GalleryRepository();

export const galleryController = {
  async getPublicGallery(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 20, 10);
      const category = req.query.category || null;

      const result = await galleryRepo.findPublished({ category, page, limit });
      res.json({
        success: true,
        data: result.items,
        meta: { pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  async createAdminItem(req, res, next) {
    try {
      const { mediaAssetId, title, caption, altText, category, sortOrder } = req.body;
      if (!mediaAssetId) {
        throw ApiError.badRequest('mediaAssetId is required.');
      }
      const item = await galleryRepo.create({
        media_asset_id: mediaAssetId,
        title,
        caption,
        alt_text: altText,
        category,
        sort_order: sortOrder || 0,
        status: 'published',
      });
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  },
};
