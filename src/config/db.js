import { MongoClient } from 'mongodb';
import { env } from './env.js';
import { logger } from '../security/logger.js';

const uri = env.MONGODB_URI;
const dbName = env.DB_NAME;

if (!uri) {
  logger.warn('MONGODB_URI is not set. Database features will be unavailable in this session.');
}

const client = uri ? new MongoClient(uri) : null;
let dbInstance = null;

/**
 * Connects to MongoDB cluster and initializes DB instance
 */
export async function connectToMongoDB() {
  if (!client) {
    logger.warn('Skipping MongoDB connection: no MONGODB_URI configured.');
    return null;
  }

  try {
    if (!dbInstance) {
      await client.connect();
      dbInstance = client.db(dbName);
      logger.info(`Successfully connected to MongoDB database: "${dbInstance.databaseName}"`);
    }
    return dbInstance;
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
}

/**
 * Returns active database instance
 */
export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Please call connectToMongoDB() first.');
  }
  return dbInstance;
}

/**
 * Returns raw MongoClient instance
 */
export function getClient() {
  return client;
}

/**
 * Gracefully closes MongoDB connection
 */
export async function disconnectFromMongoDB() {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed.');
  }
}
