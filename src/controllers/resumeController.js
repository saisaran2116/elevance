const { Resume } = require('../models');
const { generateOTP, verifyOTP, sendEmail } = require('../utils/messagingService');

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
