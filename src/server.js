import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { testConnection, pool } from './database/pool.js';

const PORT = env.PORT;

async function startServer() {
  try {
    // 1. Validate environment configurations
    validateEnv();

    // 2. Test PostgreSQL database connection
    console.log('Connecting to PostgreSQL database...');
    await testConnection();

    // 3. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Express backend running in ${env.NODE_ENV} mode on port ${PORT}`);
      console.log(`[SERVER] API Endpoint base: http://localhost:${PORT}/api/v1`);
    });

    // 4. Graceful Shutdown handler
    const shutdown = async (signal) => {
      console.log(`\n${signal} signal received: Closing HTTP server and PostgreSQL pool...`);
      server.close(async () => {
        try {
          await pool.end();
          console.log('[SERVER] PostgreSQL pool closed gracefully.');
          process.exit(0);
        } catch (err) {
          console.error('[ERROR] Error closing PostgreSQL pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('[CRITICAL] Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
