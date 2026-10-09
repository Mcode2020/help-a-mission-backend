import BaseRepository from './base.repo.js';

export class MemberRepository extends BaseRepository {
  constructor() {
    super('members', true);
  }

  async findPublished({ page = 1, limit = 50, language = 'en' } = {}) {
    const offset = (page - 1) * limit;

    let qb = this.query().where({ status: 'published' });
    if (language) {
      qb = qb.where(function () {
        this.where({ language }).orWhereNull('language');
      });
    }

    const items = await qb
      .clone()
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await qb.count({ count: '*' });
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

  async findAllAdmin({ page = 1, limit = 50, search = '', language } = {}) {
    const offset = (page - 1) * limit;
    
    let qb = this.query();

    if (language) {
      qb = qb.where(function () {
        this.where({ language }).orWhereNull('language');
      });
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      qb = qb.where(function () {
        this.whereRaw('LOWER(name) LIKE ?', [term])
          .orWhereRaw('LOWER(title) LIKE ?', [term])
          .orWhereRaw('LOWER(email) LIKE ?', [term])
          .orWhereRaw('LOWER(phone) LIKE ?', [term]);
      });
    }

    const items = await qb
      .clone()
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await qb.count({ count: '*' });
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

export default MemberRepository;
