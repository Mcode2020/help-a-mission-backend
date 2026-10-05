import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'help_a_mission_db';

if (!uri) {
  console.error('CRITICAL: MONGODB_URI is missing in environment variables (.env file).');
}

const client = new MongoClient(uri);
let dbInstance = null;

/**
 * Connects to MongoDB cluster and initializes DB instance
 */
export async function connectToMongoDB() {
  try {
    if (!dbInstance) {
      await client.connect();
      dbInstance = client.db(dbName);
      console.log(`✅ Successfully connected to MongoDB database: "${dbInstance.databaseName}"`);
    }
    return dbInstance;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
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
    console.log('🔌 MongoDB connection closed.');
  }
}
