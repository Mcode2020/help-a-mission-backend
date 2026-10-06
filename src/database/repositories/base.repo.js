import db from '../knex.client.js';

export class BaseRepository {
  /**
   * @param {string} tableName Name of the target database table
   * @param {boolean} hasSoftDelete Whether table supports soft delete (deleted_at)
   * @param {boolean} hasUpdatedAt Whether table has updated_at column
   */
  constructor(tableName, hasSoftDelete = false, hasUpdatedAt = true) {
    this.tableName = tableName;
    this.hasSoftDelete = hasSoftDelete;
    this.hasUpdatedAt = hasUpdatedAt;
  }

  query(trx = null) {
    const qb = trx ? trx(this.tableName) : db(this.tableName);
    if (this.hasSoftDelete) {
      qb.whereNull(`${this.tableName}.deleted_at`);
    }
    return qb;
  }

  async findById(id, trx = null) {
    return await this.query(trx).where(`${this.tableName}.id`, id).first();
  }

  async findAll({ page = 1, limit = 20, orderBy = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    const items = await this.query()
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.query().count({ count: '*' });
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

  async findWhere(conditions, trx = null) {
    return await this.query(trx).where(conditions);
  }

  async findOneWhere(conditions, trx = null) {
    return await this.query(trx).where(conditions).first();
  }

  async create(data, trx = null) {
    const qb = trx ? trx(this.tableName) : db(this.tableName);
    const [created] = await qb.insert(data).returning('*');
    return created;
  }

  async update(id, data, trx = null) {
    const payload = { ...data };
    if (this.hasUpdatedAt) {
      payload.updated_at = new Date();
    }
    const qb = trx ? trx(this.tableName) : db(this.tableName);
    const [updated] = await qb.where({ id }).update(payload).returning('*');
    return updated;
  }

  async delete(id, trx = null) {
    const qb = trx ? trx(this.tableName) : db(this.tableName);
    if (this.hasSoftDelete) {
      const [deleted] = await qb.where({ id }).update({ deleted_at: new Date() }).returning('*');
      return deleted;
    }
    return await qb.where({ id }).del();
  }
}

export default BaseRepository;
