import { CmsPageRepository, AuditEventRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const cmsRepo = new CmsPageRepository();
const auditRepo = new AuditEventRepository();

const extractLanguage = (req) => {
  const lang = req.query.language || req.body?.language || req.headers['accept-language'] || 'en';
  const cleanLang = String(lang).toLowerCase().split(',')[0].trim();
  return ['en', 'hi'].includes(cleanLang) ? cleanLang : 'en';
};

export const cmsController = {
  /**
   * GET /api/v1/public/home?language=en
   */
  async getPublicHome(req, res, next) {
    try {
      const language = extractLanguage(req);
      let page = await cmsRepo.getPageWithSections('home', language, true);
      if (!page) {
        return res.json({
          success: true,
          data: {
            slug: 'home',
            title: 'Help A Mission Welfare Society',
            language,
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
   * GET /api/v1/public/cms/pages/:slug?language=en
   */
  async getPublicPage(req, res, next) {
    try {
      const { slug } = req.params;
      const language = extractLanguage(req);
      let page = await cmsRepo.getPageWithSections(slug, language, true);
      if (!page) {
        return res.json({
          success: true,
          data: {
            slug,
            title: slug.toUpperCase(),
            language,
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
   * GET /api/v1/admin/cms/pages/:slug?language=en
   */
  async getAdminPage(req, res, next) {
    try {
      const { slug } = req.params;
      const language = extractLanguage(req);
      const page = await cmsRepo.getPageWithSections(slug, language, false);
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
   * PUT /api/v1/admin/cms/pages/:slug/sections?language=en
   */
  async updatePageSections(req, res, next) {
    try {
      const { slug } = req.params;
      const { sections } = req.body;
      const language = extractLanguage(req);

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
          sortOrder || 0,
          language
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
        afterRedacted: { slug, language, updatedCount: updatedSections.length },
      });

      res.json({
        success: true,
        message: `CMS sections updated successfully for language '${language}'.`,
      });
    } catch (err) {
      next(err);
    }
  },
};
