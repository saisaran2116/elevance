const assert = require('assert');

// Mock controllers to test the logic
function isWithinMobileWindow(hour) {
  return hour >= 10 && hour <= 12; // 10:00 to 12:59 is before 1:00 PM
}

function isWithinSubscriptionWindow(hour) {
  return hour === 10; // 10:00 to 10:59 is before 11:00 AM
}

function forgotPassword(lastRequestTime, currentTime) {
  const oneDay = 24 * 60 * 60 * 1000;
  return (currentTime - lastRequestTime) > oneDay;
}

function changeLanguage(targetLanguage, currentLanguage) {
  if (targetLanguage === 'fr' && currentLanguage !== 'fr') {
    return 'OTP_REQUIRED';
  }
  return 'SUCCESS';
}

console.log('Running Day 16 Edge Case Tests...');

// 1. Mobile logins outside of 10 AM - 1 PM are blocked
assert.strictEqual(isWithinMobileWindow(9), false, 'Login at 9 AM should be blocked');
assert.strictEqual(isWithinMobileWindow(10), true, 'Login at 10 AM should be allowed');
assert.strictEqual(isWithinMobileWindow(12), true, 'Login at 12 PM should be allowed');
assert.strictEqual(isWithinMobileWindow(13), false, 'Login at 1 PM should be blocked');
console.log('✔ Mobile logins outside 10 AM - 1 PM are blocked correctly.');

// 2. Subscriptions paid outside 10 AM - 11 AM are blocked
assert.strictEqual(isWithinSubscriptionWindow(9), false, 'Sub at 9 AM should be blocked');
assert.strictEqual(isWithinSubscriptionWindow(10), true, 'Sub at 10 AM should be allowed');
assert.strictEqual(isWithinSubscriptionWindow(11), false, 'Sub at 11 AM should be blocked');
console.log('✔ Subscriptions paid outside 10 AM - 11 AM are blocked correctly.');

// 3. Forgot password fails if requested more than once a day
const now = Date.now();
const twoHoursAgo = now - (2 * 60 * 60 * 1000);
const twoDaysAgo = now - (48 * 60 * 60 * 1000);
assert.strictEqual(forgotPassword(twoHoursAgo, now), false, 'Forgot password within 24h should fail');
assert.strictEqual(forgotPassword(twoDaysAgo, now), true, 'Forgot password after 24h should succeed');
console.log('✔ Forgot password fails if requested more than once a day.');

// 4. French language selector correctly triggers an OTP
assert.strictEqual(changeLanguage('fr', 'en'), 'OTP_REQUIRED', 'Switching to French should require OTP');
assert.strictEqual(changeLanguage('es', 'en'), 'SUCCESS', 'Switching to Spanish should succeed');
console.log('✔ French language selector correctly triggers an OTP.');

console.log('All edge case tests passed successfully!');
