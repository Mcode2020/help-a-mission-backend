import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

import adminAuthRoutes from './modules/admin-auth/admin-auth.routes.js';
import adminRbacRoutes from './modules/admin-rbac/admin-rbac.routes.js';
import cmsRoutes from './modules/cms/cms.routes.js';
import initiativesRoutes from './modules/initiatives/initiatives.routes.js';
import galleryRoutes from './modules/gallery/gallery.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import donationsRoutes from './modules/donations/donations.routes.js';
import webhooksRoutes from './modules/webhooks/webhooks.routes.js';
import userAuthRoutes from './modules/user-auth/user-auth.routes.js';
import adminReportsRoutes from './modules/admin-reports/admin-reports.routes.js';
import { cmsController } from './modules/cms/cms.controller.js';
import { PublicFileStorageService } from './services/file-storage.service.js';

const app = express();

// SECURITY: Helmet security headers
app.use(helmet());

// SECURITY: Disable Express signature header
app.disable('x-powered-by');

// SECURITY: Attach unique request ID to all incoming requests
app.use(requestIdMiddleware);

// SECURITY: Cookie parser for reading session cookies
app.use(cookieParser(env.COOKIE_SECRET));

// SECURITY: CORS policy with explicit credentials support for cookies
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  credentials: true,
}));

// Webhook raw body endpoint registered BEFORE JSON parser middleware
app.use('/api/v1', webhooksRoutes);

// SECURITY: Request body size limits (OWASP API4)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Help A Mission Welfare Society Backend API is running.',
    version: 'v1.0.0',
    docs: '/api/v1/health',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Serve uploaded public files statically
app.use('/storage/public', express.static(PublicFileStorageService.getRootDirectory()));

// Public Homepage Endpoint
app.get('/api/v1/public/home', cmsController.getPublicHome);

// API v1 User & Admin Auth Modules
app.use('/api/v1/auth', userAuthRoutes);
app.use('/api/auth', userAuthRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/rbac', adminRbacRoutes);
app.use('/api/v1', cmsRoutes);
app.use('/api/v1', initiativesRoutes);
app.use('/api/v1', galleryRoutes);
app.use('/api/v1', mediaRoutes);
app.use('/api/v1', donationsRoutes);
app.use('/api/v1', adminReportsRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
