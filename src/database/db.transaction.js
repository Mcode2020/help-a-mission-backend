import db from './knex.client.js';

/**
 * Execute callback within an atomic transaction.
 * Automatically commits on success and rolls back on failure.
 * @param {Function} callback Callback receiving the Knex transaction object (`trx`)
 */
export async function withTransaction(callback) {
  return await db.transaction(async (trx) => {
    return await callback(trx);
  });
}

export default withTransaction;
