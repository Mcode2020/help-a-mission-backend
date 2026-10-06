import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class CmsPageRepository extends BaseRepository {
  constructor() {
    super('cms_pages', false);
  }

  async findBySlug(slug) {
    return await this.findOneWhere({ slug });
  }

  async getPageWithSections(slug) {
    const page = await this.findBySlug(slug);
    if (!page) return null;

    const sections = await db('cms_sections')
      .where({ page_id: page.id, status: 'published' })
      .orderBy('sort_order', 'asc');

    return {
      ...page,
      sections,
    };
  }

  async upsertSection(pageId, sectionKey, sectionType, contentJson, sortOrder = 0, trx = null) {
    const targetDb = trx || db;
    const existing = await targetDb('cms_sections').where({ page_id: pageId, section_key: sectionKey }).first();

    if (existing) {
      const [updated] = await targetDb('cms_sections')
        .where({ id: existing.id })
        .update({
          content_json: JSON.stringify(contentJson),
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
        content_json: JSON.stringify(contentJson),
        status: 'published',
        version: 1,
      })
      .returning('*');
    return created;
  }
}

export default CmsPageRepository;
