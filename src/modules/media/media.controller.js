import fs from 'node:fs';
import { PublicFileStorageService, PrivateFileStorageService } from '../../services/file-storage.service.js';
import { MediaAssetRepository, AuditEventRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const mediaRepo = new MediaAssetRepository();
const auditRepo = new AuditEventRepository();

export const mediaController = {
  /**
   * POST /api/v1/admin/media/upload
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded.');
      }

      const visibility = req.body.visibility === 'private' ? 'private' : 'public';
      const subfolder = req.body.subfolder || (visibility === 'private' ? 'internal' : 'images');

      let savedMeta;
      if (visibility === 'public') {
        savedMeta = await PublicFileStorageService.saveFile({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          subfolder,
        });
      } else {
        savedMeta = await PrivateFileStorageService.saveFile({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          subfolder,
        });
      }

      const asset = await mediaRepo.create({
        visibility: savedMeta.visibility,
        storage_type: savedMeta.storageType,
        relative_path: savedMeta.relativePath,
        public_url: savedMeta.publicUrl,
        mime_type: savedMeta.mimeType,
        size_bytes: savedMeta.sizeBytes,
        sha256: savedMeta.sha256,
        uploaded_by: req.admin.id,
      });

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/private-files/:id
   */
  async streamPrivateFile(req, res, next) {
    try {
      const { id } = req.params;
      const asset = await mediaRepo.findById(id);

      if (!asset || asset.visibility !== 'private') {
        throw ApiError.notFound('Private file asset not found.');
      }

      const fullPath = await PrivateFileStorageService.getAbsolutePath(asset.relative_path);

      await auditRepo.logEvent({
        requestId: req.requestId || 'system',
        actorType: 'admin',
        actorId: req.admin.id,
        action: 'private_file_download',
        entityType: 'media_asset',
        entityId: asset.id,
        afterRedacted: { relativePath: asset.relative_path },
      });

      res.setHeader('Content-Type', asset.mime_type);
      res.setHeader('Content-Length', asset.size_bytes);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/media
   */
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 30;
      const result = await mediaRepo.findAll({ page, limit });
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
