import express from 'express';
import { login, registerUser, getProfile } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', registerUser); // Removed restricted access for now to allow registration from frontend
router.get('/profile', authenticateToken, getProfile);

export default router;
