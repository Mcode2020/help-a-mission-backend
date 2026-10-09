import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class CmsPageRepository extends BaseRepository {
  constructor() {
    super('cms_pages', false);
  }

  async findBySlug(slug) {
    return await this.findOneWhere({ slug });
  }

  /**
   * Get page with sections supporting language and fallback.
   * @param {string} slug 
   * @param {string} language - 'en' | 'hi'
   * @param {boolean} isPublic - whether request is from public website (enables fallback)
   */
  async getPageWithSections(slug, language = 'en', isPublic = false) {
    const page = await this.findBySlug(slug);
    if (!page) return null;

    const requestedLang = (language || 'en').toLowerCase();

    // Fetch all published sections for this page
    const allSections = await db('cms_sections')
      .where({ page_id: page.id, status: 'published' })
      .orderBy('sort_order', 'asc');

    if (isPublic) {
      // Public site: Return sections for requested language, falling back to 'en' if missing
      const sectionsByKey = {};
      const enSectionsByKey = {};

      for (const sec of allSections) {
        if (sec.language === requestedLang) {
          sectionsByKey[sec.section_key] = sec;
        }
        if (sec.language === 'en') {
          enSectionsByKey[sec.section_key] = sec;
        }
      }

      // Merge: requested language overrides fallback 'en'
      const finalSectionsMap = { ...enSectionsByKey, ...sectionsByKey };
      const finalSections = Object.values(finalSectionsMap).sort((a, b) => a.sort_order - b.sort_order);

      return {
        ...page,
        language: requestedLang,
        sections: finalSections,
      };
    } else {
      // Admin site: Return sections strictly for requested language + translation status summary
      const currentSections = allSections.filter((sec) => sec.language === requestedLang);

      const knownKeys = ['hero', 'about', 'initiatives', 'gallery', 'donation_settings', 'mission_cta', 'seo'];
      const allKeys = Array.from(new Set([...knownKeys, ...allSections.map((s) => s.section_key)]));

      const translationStatus = {};
      for (const key of allKeys) {
        const enSec = allSections.find((s) => s.section_key === key && s.language === 'en');
        const hiSec = allSections.find((s) => s.section_key === key && s.language === 'hi');

        const enStatus = enSec ? checkSectionCompleteness(enSec.content_json) : 'missing';
        const hiStatus = hiSec ? checkSectionCompleteness(hiSec.content_json) : 'missing';
        const currentStatus = requestedLang === 'hi' ? hiStatus : enStatus;

        translationStatus[key] = {
          en: enStatus,
          hi: hiStatus,
          current: currentStatus,
        };
      }

      return {
        ...page,
        language: requestedLang,
        sections: currentSections,
        translationStatus,
      };
    }
  }

  async upsertSection(pageId, sectionKey, sectionType, contentJson, sortOrder = 0, language = 'en', trx = null) {
    const targetDb = trx || db;
    const lang = (language || 'en').toLowerCase();

    const existing = await targetDb('cms_sections')
      .where({ page_id: pageId, section_key: sectionKey, language: lang })
      .first();

    const formattedContent = typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson);

    if (existing) {
      const [updated] = await targetDb('cms_sections')
        .where({ id: existing.id })
        .update({
          content_json: formattedContent,
          section_type: sectionType,
          sort_order: sortOrder,
          version: existing.version + 1,
          updated_at: new Date(),
        })
        .returning('*');
      return updated;
    }

    const [created] = await targetDb('cms_sections')
      .insert({
        page_id: pageId,
        section_key: sectionKey,
        section_type: sectionType,
        sort_order: sortOrder,
        content_json: formattedContent,
        language: lang,
        status: 'published',
        version: 1,
      })
      .returning('*');
    return created;
  }
}

/**
 * Checks section content completeness:
 * 'complete' (✓), 'incomplete' (⚠), or 'missing' (✕)
 */
function checkSectionCompleteness(contentJson) {
  if (!contentJson) return 'missing';
  let data = contentJson;
  if (typeof contentJson === 'string') {
    try {
      data = JSON.parse(contentJson);
    } catch {
      return 'missing';
    }
  }

  if (typeof data !== 'object' || data === null) return 'missing';

  const stringValues = [];
  const extractStrings = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        stringValues.push(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractStrings(obj[key]);
      }
    }
  };

  extractStrings(data);

  if (stringValues.length === 0) return 'missing';

  const filledCount = stringValues.filter((s) => s && s.trim().length > 0).length;
  if (filledCount === stringValues.length) return 'complete';
  if (filledCount > 0) return 'incomplete';
  return 'missing';
}

export default CmsPageRepository;
