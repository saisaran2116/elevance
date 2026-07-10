const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Route to create a Razorpay order
router.post('/create-order', protect, subscriptionController.createOrder);

// Route to verify Razorpay payment and update subscription
router.post('/verify', protect, subscriptionController.verifyPayment);

module.exports = router;
