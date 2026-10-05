import dotenv from 'dotenv';
import app from './app.js';
import { connectToMongoDB, disconnectFromMongoDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to Database
    await connectToMongoDB();

    // Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    // Graceful Shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n${signal} signal received: closing HTTP server and Database connection...`);
      server.close(async () => {
        await disconnectFromMongoDB();
        console.log('👋 Process terminated successfully.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
