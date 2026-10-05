import app from './app.js';
import { env } from './config/env.js';
import { connectToMongoDB, disconnectFromMongoDB } from './config/db.js';
import { logger } from './security/logger.js';

const PORT = env.PORT;

async function startServer() {
  try {
    // Connect to Database
    await connectToMongoDB();

    // Start Express HTTP Server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful Shutdown handling
    const shutdown = async (signal) => {
      logger.info(`${signal} signal received: closing HTTP server and Database connection`);
      server.close(async () => {
        await disconnectFromMongoDB();
        logger.info('Process terminated gracefully');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
