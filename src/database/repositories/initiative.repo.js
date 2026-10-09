import BaseRepository from './base.repo.js';

export class InitiativeRepository extends BaseRepository {
  constructor() {
    super('initiatives', false);
  }

  async findBySlug(slug) {
    return await this.findOneWhere({ slug });
  }

  async findPublished({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const items = await this.query()
      .where({ status: 'published' })
      .orderBy('published_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.query().where({ status: 'published' }).count({ count: '*' });
    const total = parseInt(count, 10);

    return {
      items,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default InitiativeRepository;
