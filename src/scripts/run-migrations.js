import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures the target PostgreSQL database exists; if not, creates it using the admin client.
 */
async function ensureDatabaseExists() {
  try {
    const dbUrl = new URL(env.DATABASE_URL);
    const targetDb = dbUrl.pathname.replace(/^\//, '');

    if (!targetDb || targetDb === 'postgres') return;

    // Connect to default 'postgres' database to check/create target database
    dbUrl.pathname = '/postgres';
    const adminClient = new pg.Client({ connectionString: dbUrl.toString() });

    await adminClient.connect();
    const res = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);

    if (res.rowCount === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating database...`);
      const safeDbName = targetDb.replace(/"/g, '""');
      await adminClient.query(`CREATE DATABASE "${safeDbName}";`);
      console.log(`[SUCCESS] Database "${targetDb}" created successfully!`);
    }

    await adminClient.end();
  } catch (err) {
    console.error('Database auto-create notice:', err.message);
  }
}

export async function runMigrations() {
  console.log('--- Starting PostgreSQL Database Migrations ---');

  // 1. Ensure database exists before loading pool connection
  await ensureDatabaseExists();

  // 2. Import pool lazily after database creation
  const { pool, testConnection } = await import('../database/pool.js');

  // 3. Verify connection to target database
  await testConnection();

  // 4. Read and execute migration SQL files
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Executing migration file: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Successfully applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Error executing migration ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('--- All Migrations Completed Successfully ---');
}

// Run directly if called from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err.message || err);
      process.exit(1);
    });
}
