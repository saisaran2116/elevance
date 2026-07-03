const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginHistory } = require('../models');

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
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Parse UA and IP for login history
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials',
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

module.exports = {
  register,
  login,
};
