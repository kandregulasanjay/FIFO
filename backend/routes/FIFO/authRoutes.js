const express = require('express');
const {  login, logout } = require('../../controllers/FIFO/auth/authController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);

module.exports = router;
