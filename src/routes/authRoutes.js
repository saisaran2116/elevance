const express = require('express');
const { register, login, getLoginHistory, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/login-history', protect, getLoginHistory);
router.post('/logout', logout);

module.exports = router;
