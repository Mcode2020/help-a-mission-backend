import { CmsPageRepository, AuditEventRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const cmsRepo = new CmsPageRepository();
const auditRepo = new AuditEventRepository();

export const cmsController = {
  /**
   * GET /api/v1/public/home
   */
  async getPublicHome(req, res, next) {
    try {
      let page = await cmsRepo.getPageWithSections('home');
      if (!page) {
        // Return default fallback home payload if not created yet
        return res.json({
          success: true,
          data: {
            slug: 'home',
            title: 'Help A Mission Welfare Society',
            sections: [],
          },
        });
      }

      res.json({
        success: true,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/admin/cms/pages/:slug
   */
  async getAdminPage(req, res, next) {
    try {
      const { slug } = req.params;
      const page = await cmsRepo.getPageWithSections(slug);
      if (!page) {
        throw ApiError.notFound(`CMS page with slug '${slug}' not found.`);
      }

      res.json({
        success: true,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/admin/cms/pages/:slug/sections
   */
  async updatePageSections(req, res, next) {
    try {
      const { slug } = req.params;
      const { sections } = req.body;

      if (!Array.isArray(sections)) {
        throw ApiError.badRequest('sections must be an array of section objects.');
      }

      let page = await cmsRepo.findBySlug(slug);
      if (!page) {
        page = await cmsRepo.create({
          slug,
          title: slug.toUpperCase(),
          status: 'draft',
          created_by: req.admin.id,
        });
      }

      const updatedSections = [];
      for (const sec of sections) {
        const { sectionKey, sectionType, contentJson, sortOrder } = sec;
        const updated = await cmsRepo.upsertSection(
          page.id,
          sectionKey,
          sectionType || 'custom',
          contentJson || {},
          sortOrder || 0
        );
        updatedSections.push(updated);
      }

      await auditRepo.logEvent({
        requestId: req.requestId || 'system',
        actorType: 'admin',
        actorId: req.admin.id,
        action: 'cms_sections_update',
        entityType: 'cms_page',
        entityId: page.id,
        afterRedacted: { slug, updatedCount: updatedSections.length },
      });

      res.json({
        success: true,
        message: 'CMS sections updated successfully.',
        data: { sections: updatedSections },
      });
    } catch (err) {
      next(err);
    }
  },
};
