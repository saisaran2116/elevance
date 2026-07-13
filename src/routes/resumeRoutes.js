const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtpAndSaveResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // simple setup for now

// Request OTP for resume creation (protected route, requires login)
router.post('/request-otp', protect, requestOtp);

// Verify OTP and save resume draft (protected route, requires login)
router.post('/verify-otp', protect, upload.single('photo'), verifyOtpAndSaveResume);

module.exports = router;
