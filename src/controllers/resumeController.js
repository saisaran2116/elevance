const { Resume } = require('../models');
const { generateOTP, verifyOTP, sendEmail } = require('../utils/messagingService');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateResumePdf } = require('../utils/resumeGenerator');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret',
});

exports.requestOtp = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found.' });
    }

    // Generate and store OTP
    const otpCode = await generateOTP(user.email, 'email');

    // Send OTP email
    const subject = 'Your Resume Creation OTP';
    const text = `Hello ${user.name || 'User'},\n\nYour OTP for premium resume creation is: ${otpCode}\nThis code is valid for 5 minutes.`;
    
    await sendEmail(user.email, subject, text);

    return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error in requestOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.verifyOtpAndSaveResume = async (req, res) => {
  try {
    const user = req.user;
    const { otp, name, qualifications, experience, personalInfo } = req.body;

    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found.' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }

    // Verify OTP
    const isValid = await verifyOTP(user.email, 'email', otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // Save Resume Draft (placeholder for photo upload right now)
    const newResume = await Resume.create({
      userId: user.id,
      name,
      qualifications,
      experience,
      personalInfo: personalInfo ? { details: personalInfo } : {},
      // photoPath: req.file ? req.file.path : null // if using multer
    });

    return res.status(200).json({ 
      success: true, 
      message: 'OTP verified and resume details saved.',
      resumeId: newResume.id
    });
  } catch (error) {
    console.error('Error in verifyOtpAndSaveResume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'Resume ID is required.' });
    }

    const options = {
      amount: 50 * 100, // ₹50 in paise
      currency: 'INR',
      receipt: `receipt_resume_${resumeId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order for resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.verifyPaymentAndGenerateResume = async (req, res) => {
  try {
    const user = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, resumeId } = req.body;

    if (!resumeId) {
       return res.status(400).json({ success: false, message: 'Resume ID is required.' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const resume = await Resume.findOne({ where: { id: resumeId, userId: user.id } });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume draft not found.' });
    }

    // Generate PDF
    const fileUrl = await generateResumePdf(resume, user);
    
    // Update Resume record
    resume.fileUrl = fileUrl;
    await resume.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and resume generated successfully.',
      fileUrl: fileUrl,
      resumeId: resume.id
    });
  } catch (error) {
    console.error('Error verifying payment for resume:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
