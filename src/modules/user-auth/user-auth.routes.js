// @intent Express router defining public and protected endpoints for User Authentication.
import { Router } from 'express';
import { userAuthController } from './user-auth.controller.js';
import { authenticateUser } from '../../middleware/authenticate-user.js';

const router = Router();

// Public User Authentication routes
router.post('/signup', userAuthController.signUp);
router.post('/login', userAuthController.login);
router.post('/logout', userAuthController.logout);

// Protected User Authentication routes
router.get('/me', authenticateUser, userAuthController.getMe);

export default router;
