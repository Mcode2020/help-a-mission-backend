import dotenv from 'dotenv';

// Load .env variables
dotenv.config();

// TYPE-SAFETY: Centralized validated configuration — avoids undefined runtime crashes
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  DB_NAME: process.env.DB_NAME || 'help_a_mission_db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

// Validate mandatory environment configs in production
if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
  throw new Error('CRITICAL: MONGODB_URI is mandatory in production environment.');
}
