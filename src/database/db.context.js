import db from './knex.client.js';

export class DbContext {
  /**
   * Execute raw SQL query returning multiple rows
   */
  static async queryBatch(sql, params = []) {
    const result = await db.raw(sql, params);
    return result.rows || result;
  }

  /**
   * Execute raw SQL query returning single row
   */
  static async querySingle(sql, params = []) {
    const rows = await this.queryBatch(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute raw DML command (INSERT / UPDATE / DELETE) returning count
   */
  static async execute(sql, params = []) {
    const result = await db.raw(sql, params);
    return result.rowCount || 0;
  }

  /**
   * Return Knex builder for specific table
   */
  static table(tableName) {
    return db(tableName);
  }
}

export default DbContext;
