const { sequelize, User, PasswordReset } = require('../models');
const { forgotPassword } = require('../controllers/authController');
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

    console.log('\n--- Running Test: Custom Password Generator Constraints ---');
    const { generateCustomPassword } = require('./passwordGenerator');
    for (let i = 0; i < 100; i++) {
      const pwd = generateCustomPassword(12);
      if (pwd.length !== 12) {
        throw new Error(`Password generator failed: expected length 12, got ${pwd.length}`);
      }
      if (!/^[a-zA-Z]+$/.test(pwd)) {
        throw new Error(`Password generator failed: password "${pwd}" contains non-letter characters`);
      }
    }
    console.log('Password Generator Passed: All 100 test passwords contain only letters and are of correct length.');

    console.log('\n--- Creating test user ---');
    const email = 'forgot-test@example.com';
    const phone = '+1234567890';
    
    // Clean up any existing test user or logs
    await User.destroy({ where: { email } });
    await PasswordReset.destroy({ where: { target: email } });
    await PasswordReset.destroy({ where: { target: phone } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('oldpassword123', salt);
    
    const user = await User.create({
      name: 'Forgot Test User',
      email,
      password: hashedPassword,
      phone,
      language: 'en'
    });
    console.log('Test user created successfully.');

    // --- TEST 1: First request (should succeed) ---
    console.log('\n--- Running Test 1: First request (email) ---');
    const req1 = { body: { email } };
    const res1 = createMockResponse();

    await forgotPassword(req1, res1);

    console.log('Response Status:', res1.statusCode);
    console.log('Response Data:', res1.jsonData);

    if (res1.statusCode !== 200 || !res1.jsonData.success) {
      throw new Error('Test 1 failed: first forgot password request should succeed.');
    }
    if (!res1.jsonData.password) {
      throw new Error('Test 1 failed: expected password in response data');
    }
    if (!/^[a-zA-Z]+$/.test(res1.jsonData.password)) {
      throw new Error(`Test 1 failed: password "${res1.jsonData.password}" should only contain letters`);
    }
    console.log('Test 1 Passed: Request succeeded and generated password was returned.');

    // Verify password was updated in DB
    const updatedUser = await User.findByPk(user.id);
    const isOldPasswordMatch = await bcrypt.compare('oldpassword123', updatedUser.password);
    if (isOldPasswordMatch) {
      throw new Error('Test 1 failed: User password in database was not changed.');
    }
    console.log('Test 1 Passed: Password in database was successfully updated.');
    console.log('Verification: Hashed password database check successfully verified.');

    // --- TEST 2: Second request (should fail) ---
    console.log('\n--- Running Test 2: Second request (email, same day) ---');
    const req2 = { body: { email } };
    const res2 = createMockResponse();

    await forgotPassword(req2, res2);

    console.log('Response Status:', res2.statusCode);
    console.log('Response Data:', res2.jsonData);

    if (res2.statusCode !== 400) {
      throw new Error(`Test 2 failed: expected status code 400, got ${res2.statusCode}`);
    }
    if (res2.jsonData.message !== 'You can use this option only once per day.') {
      throw new Error(`Test 2 failed: expected warning message "You can use this option only once per day.", got "${res2.jsonData.message}"`);
    }
    console.log('Test 2 Passed: Request blocked with the correct warning message.');

    // --- TEST 3: Third request via phone (should also fail since same user/day) ---
    console.log('\n--- Running Test 3: Third request (phone, same day) ---');
    const req3 = { body: { phone } };
    const res3 = createMockResponse();

    await forgotPassword(req3, res3);

    console.log('Response Status:', res3.statusCode);
    console.log('Response Data:', res3.jsonData);

    if (res3.statusCode !== 400) {
      throw new Error(`Test 3 failed: expected status code 400, got ${res3.statusCode}`);
    }
    if (res3.jsonData.message !== 'You can use this option only once per day.') {
      throw new Error(`Test 3 failed: expected warning message "You can use this option only once per day.", got "${res3.jsonData.message}"`);
    }
    console.log('Test 3 Passed: Request blocked by phone rate limiting.');

    // --- Clean Up ---
    console.log('\n--- Cleaning up test records ---');
    await User.destroy({ where: { id: user.id } });
    await PasswordReset.destroy({ where: { userId: user.id } });
    console.log('Clean up complete.');
    console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');
  } catch (error) {
    console.error('Test Suite Failed ❌', error);
    process.exit(1);
  }
}

runTests();
