const express = require('express');
const { register, login, getLoginHistory, logout, verifyLoginOTP, resendLoginOTP, forgotPassword, updateLanguage } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/login-history', protect, getLoginHistory);
router.post('/logout', logout);
router.post('/verify-otp', verifyLoginOTP);
router.post('/resend-otp', resendLoginOTP);
router.post('/forgot-password', forgotPassword);
router.put('/language', protect, updateLanguage);

module.exports = router;
