const Razorpay = require('razorpay');
const crypto = require('crypto');
const { User, Subscription } = require('../models');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret',
});

const PLANS = {
  Bronze: { amount: 100 * 100, applications: 3 }, // ₹100
  Silver: { amount: 300 * 100, applications: 5 }, // ₹300
  Gold: { amount: 1000 * 100, applications: -1 }, // ₹1000 (-1 for unlimited)
};

exports.createOrder = async (req, res) => {
  try {
    const { planName } = req.body;
    
    if (!PLANS[planName]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const options = {
      amount: PLANS[planName].amount,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;
    const userId = req.user.id; // Assumes authMiddleware sets req.user

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
    }

    // Payment is valid, update user and create subscription record
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update User
    user.isPremium = true;
    user.currentPlan = planName;
    user.monthlyApplicationsCount = 0; // Reset count
    user.lastPlanResetDate = new Date();
    await user.save();

    // Record Subscription
    await Subscription.create({
      userId: user.id,
      planName: planName,
      amountPaid: PLANS[planName].amount / 100,
      status: 'succeeded',
      paymentGateway: 'Razorpay',
      transactionId: razorpay_payment_id,
    });

    res.json({ success: true, message: 'Payment verified and plan updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
