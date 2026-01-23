const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authenticateToken, authorizeRole(['ADMIN']), authController.registerUser);

module.exports = router;
