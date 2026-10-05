import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

// SECURITY: helmet — adds CSP/HSTS/nosniff/frame headers and hides the Express fingerprint
app.use(helmet());

// SECURITY: disable x-powered-by — prevents technology fingerprinting
app.disable('x-powered-by');

// SECURITY: cors allow-list configuration
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  credentials: true
}));

// SECURITY: explicit size limits — one oversized request can exhaust memory (OWASP API4)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// SECURITY: Public root health endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Help A Mission Welfare Society Backend API is running successfully!',
    docs: '/api/health'
  });
});

// Register Categorized API Routes
app.use('/api', routes);

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
