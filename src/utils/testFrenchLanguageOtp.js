const { sequelize, User, OTP } = require('../models');
const { updateLanguage } = require('../controllers/authController');
const bcrypt = require('bcryptjs');

// Simple mock for Express Response object
function createMockResponse() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  try {
    console.log('--- Initializing database connection ---');
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('\n--- Creating test user ---');
    const email = 'french-test@example.com';
    
    // Clean up any existing test user or OTPs
    await User.destroy({ where: { email } });
    await OTP.destroy({ where: { target: email } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'French Test User',
      email,
      password: hashedPassword,
      phone: '+15555555555',
      language: 'en'
    });
    console.log('Test user created successfully with language: en');

    // --- TEST 1: Request French language switch (should require OTP) ---
    console.log('\n--- Running Test 1: Request French switch (no OTP) ---');
    const req1 = {
      user,
      body: { language: 'fr' }
    };
    const res1 = createMockResponse();

    await updateLanguage(req1, res1);

    console.log('Response Status:', res1.statusCode);
    console.log('Response Data:', res1.jsonData);

    if (res1.statusCode !== 200 || !res1.jsonData.success || !res1.jsonData.requireOtp) {
      throw new Error('Test 1 failed: French language switch should trigger requireOtp.');
    }
    console.log('Test 1 Passed: Request succeeded and signaled OTP verification is required.');

    // --- TEST 2: Submit invalid OTP (should fail) ---
    console.log('\n--- Running Test 2: Submit invalid OTP ---');
    const req2 = {
      user,
      body: { language: 'fr', otp: '000000' }
    };
    const res2 = createMockResponse();

    await updateLanguage(req2, res2);

    console.log('Response Status:', res2.statusCode);
    console.log('Response Data:', res2.jsonData);

    if (res2.statusCode !== 400 || res2.jsonData.success) {
      throw new Error('Test 2 failed: Invalid OTP should return 400 error.');
    }
    
    // Verify language in DB is still 'en'
    const userAfterFailedOtp = await User.findByPk(user.id);
    if (userAfterFailedOtp.language !== 'en') {
      throw new Error(`Test 2 failed: Preferred language changed to ${userAfterFailedOtp.language} on invalid OTP`);
    }
    console.log('Test 2 Passed: Invalid OTP was correctly rejected, and language preference remained "en".');

    // --- TEST 3: Submit valid OTP (should succeed) ---
    console.log('\n--- Running Test 3: Submit valid OTP ---');
    
    // Find the latest OTP from database
    const otpRecord = await OTP.findOne({
      where: { target: email, type: 'email', verified: false },
      order: [['createdAt', 'DESC']]
    });
    
    if (!otpRecord) {
      throw new Error('Test 3 failed: No OTP record found in the database.');
    }
    
    const validOtpCode = otpRecord.value;
    console.log(`Found valid OTP code in database: ${validOtpCode}`);

    const req3 = {
      user,
      body: { language: 'fr', otp: validOtpCode }
    };
    const res3 = createMockResponse();

    await updateLanguage(req3, res3);

    console.log('Response Status:', res3.statusCode);
    console.log('Response Data:', res3.jsonData);

    if (res3.statusCode !== 200 || !res3.jsonData.success) {
      throw new Error('Test 3 failed: Valid OTP should return 200 and update language.');
    }

    // Verify language in DB is now 'fr'
    const userAfterSuccess = await User.findByPk(user.id);
    if (userAfterSuccess.language !== 'fr') {
      throw new Error(`Test 3 failed: Preferred language is ${userAfterSuccess.language}, expected "fr"`);
    }
    console.log('Test 3 Passed: Valid OTP was accepted, and preferred language updated to "fr" successfully.');

    // Clean up test user & OTPs
    await User.destroy({ where: { email } });
    await OTP.destroy({ where: { target: email } });
    console.log('\n--- Database cleaned up. All tests passed successfully! ---');
    process.exit(0);

  } catch (error) {
    console.error('\nTEST RUN FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
