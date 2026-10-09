import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Create single connection pool instance using PostgreSQL DATABASE_URL or individual configs
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute parameterized query on PostgreSQL pool.
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Test PostgreSQL connection health on application startup.
 */
export async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`PostgreSQL Connected to database "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
    return true;
  } finally {
    client.release();
  }
}

export default {
  pool,
  query,
  testConnection
};
