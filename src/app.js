import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Help A Mission Welfare Society Backend API is running successfully!',
    docs: '/api/health'
  });
});

// Register API Routes
app.use('/api', routes);

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
