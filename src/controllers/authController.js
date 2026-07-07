const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginHistory, PasswordReset } = require('../models');
const { Op } = require('sequelize');

// Helper to sign JWT token
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey12345!', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
}

// Helper to parse User Agent details
function parseUserAgent(userAgentString) {
  const ua = userAgentString || '';
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'desktop'; // Default

  // Simple browser detection
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';

  // Simple OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Simple Device detection
  if (/mobi|android|iphone|ipad|ipod/i.test(ua)) {
    device = 'mobile';
  } else {
    device = 'desktop';
  }

  return { browser, os, device };
}

// Helper to check if current time is within 10:00 AM to 1:00 PM IST
function isWithinMobileWindow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
  const formattedString = formatter.format(now);
  const [hours, minutes, seconds] = formattedString.split(':').map(Number);
  
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  const startSeconds = 10 * 3600; // 10:00:00 AM
  const endSeconds = 13 * 3600;   // 01:00:00 PM
  
  return totalSeconds >= startSeconds && totalSeconds <= endSeconds;
}

/**
 * Register user
 * @route POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, phone, language } = req.body;

    // Validate request
    if (!name || !email || !password) {
      return res.status(404).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(404).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      language: language || 'en',
    });

    // Generate Token
    const token = generateToken(user.id);

    // Cookie Options
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        isPremium: user.isPremium,
        currentPlan: user.currentPlan,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
}

/**
 * Login user
 * @route POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password, deviceType } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Parse UA and IP for login history
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device: uaDevice } = parseUserAgent(userAgent);
    const device = (deviceType && ['desktop', 'laptop', 'mobile'].includes(deviceType)) ? deviceType : uaDevice;
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if mobile login is outside of allowed time window
    if (device === 'mobile' && !isWithinMobileWindow()) {
      await LoginHistory.create({
        userId: user.id,
        browser,
        os,
        device,
        ipAddress,
        status: 'Failed',
      });
      return res.status(403).json({
        success: false,
        message: 'Mobile login is only permitted between 10:00 AM and 1:00 PM IST.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Record failed login history
      await LoginHistory.create({
        userId: user.id,
        browser,
        os,
        device,
        ipAddress,
        status: 'Failed',
      });

      return res.status(404).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Detect Google Chrome login to enforce OTP verification
    if (browser === 'Chrome') {
      const { generateOTP, sendEmail } = require('../utils/messagingService');
      const otpCode = await generateOTP(user.email, 'email');
      await sendEmail(
        user.email,
        'Your Elevance Login OTP',
        `Your security verification OTP code is: ${otpCode}\n\nThis OTP is valid for 5 minutes.`
      );

      return res.status(200).json({
        success: true,
        requireOtp: true,
        email: user.email,
        message: 'Google Chrome login detected. An OTP has been sent to your email.',
      });
    }

    // Record successful login history
    await LoginHistory.create({
      userId: user.id,
      browser,
      os,
      device,
      ipAddress,
      status: 'Success',
    });

    // Generate Token
    const token = generateToken(user.id);

    // Cookie Options
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        isPremium: user.isPremium,
        currentPlan: user.currentPlan,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
}

/**
 * Get user login history
 * @route GET /api/auth/login-history
 */
async function getLoginHistory(req, res) {
  try {
    const history = await LoginHistory.findAll({
      where: { userId: req.user.id },
      order: [['attemptTime', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving login history',
    });
  }
}

/**
 * Logout user
 * @route POST /api/auth/logout
 */
async function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

/**
 * Verify OTP code for Google Chrome login
 * @route POST /api/auth/verify-otp
 */
async function verifyLoginOTP(req, res) {
  try {
    const { email, otp, deviceType } = req.body;

    if (!email || !otp) {
      return res.status(404).json({
        success: false,
        message: 'Please provide email and OTP code',
      });
    }

    // Parse UA and IP for login history
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device: uaDevice } = parseUserAgent(userAgent);
    const device = (deviceType && ['desktop', 'laptop', 'mobile'].includes(deviceType)) ? deviceType : uaDevice;
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Double check mobile login time window (just in case they bypass/delayed verifying)
    if (device === 'mobile' && !isWithinMobileWindow()) {
      await LoginHistory.create({
        userId: user.id,
        browser,
        os,
        device,
        ipAddress,
        status: 'Failed',
      });
      return res.status(403).json({
        success: false,
        message: 'Mobile login is only permitted between 10:00 AM and 1:00 PM IST.',
      });
    }

    const { verifyOTP } = require('../utils/messagingService');
    const isValid = await verifyOTP(email, 'email', otp);

    if (!isValid) {
      // Record failed login history
      await LoginHistory.create({
        userId: user.id,
        browser,
        os,
        device,
        ipAddress,
        status: 'Failed',
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    // Record successful login history
    await LoginHistory.create({
      userId: user.id,
      browser,
      os,
      device,
      ipAddress,
      status: 'Success',
    });

    // Generate Token
    const token = generateToken(user.id);

    // Cookie Options
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        isPremium: user.isPremium,
        currentPlan: user.currentPlan,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
    });
  }
}

/**
 * Resend OTP code for Google Chrome login
 * @route POST /api/auth/resend-otp
 */
async function resendLoginOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Please provide email address',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { generateOTP, sendEmail } = require('../utils/messagingService');
    const otpCode = await generateOTP(email, 'email');
    await sendEmail(
      email,
      'Your Elevance Login OTP',
      `Your security verification OTP code is: ${otpCode}\n\nThis OTP is valid for 5 minutes.`
    );

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
    });
  } catch (error) {
    console.error('OTP resend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP resend',
    });
  }
}

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone number',
      });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReset = await PasswordReset.findOne({
      where: {
        [Op.or]: [
          { userId: user.id },
          { target: email || phone }
        ],
        requestedAt: {
          [Op.gt]: oneDayAgo
        }
      }
    });

    if (existingReset) {
      return res.status(400).json({
        success: false,
        message: 'You can use this option only once per day.',
      });
    }

    const { generateCustomPassword } = require('../utils/passwordGenerator');
    const newPassword = generateCustomPassword(12);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await PasswordReset.create({
      userId: user.id,
      target: email || phone,
    });

    const { sendEmail, sendSMS } = require('../utils/messagingService');

    if (email) {
      await sendEmail(
        user.email,
        'Your Reset Password - Elevance',
        `You requested a password reset. Your new temporary password is: ${newPassword}\n\nPlease log in using this temporary password and update it immediately.`
      );
    } else if (phone) {
      await sendSMS(
        user.phone,
        `Your temporary password is: ${newPassword}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `A temporary password has been sent to your registered ${email ? 'email address' : 'phone number'}.`,
      password: newPassword,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during forgot password'
    });
  }
}

module.exports = {
  register,
  login,
  getLoginHistory,
  logout,
  verifyLoginOTP,
  resendLoginOTP,
  forgotPassword,
};
