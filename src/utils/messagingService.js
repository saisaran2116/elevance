const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { OTP } = require('../models');
const { Op } = require('sequelize');

// Helper to generate 6-digit numeric string
function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a 6-digit OTP, stores it in the database, and returns it.
 * @param {string} target - Email or phone number
 * @param {'email'|'sms'} type - The type of OTP
 * @returns {Promise<string>} The generated OTP code
 */
async function generateOTP(target, type) {
  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  await OTP.create({
    type,
    value: code,
    target,
    expiresAt,
    verified: false,
  });

  return code;
}

/**
 * Verifies an OTP code for a given target and type.
 * @param {string} target - Email or phone number
 * @param {'email'|'sms'} type - The type of OTP
 * @param {string} value - The 6-digit OTP value to check
 * @returns {Promise<boolean>} True if valid and verified, false otherwise
 */
async function verifyOTP(target, type, value) {
  // Find the latest unverified, unexpired OTP for this target and type
  const otpRecord = await OTP.findOne({
    where: {
      target,
      type,
      verified: false,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!otpRecord) {
    return false;
  }

  if (otpRecord.value === value) {
    // Mark as verified to prevent reuse
    otpRecord.verified = true;
    await otpRecord.save();
    return true;
  }

  return false;
}

/**
 * Sends an email using Nodemailer or logs it to the console if configuration is missing.
 */
async function sendEmail(to, subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: FROM_EMAIL || 'noreply@elevance.com',
        to,
        subject,
        text,
      });
      console.log(`[Email Service] Sent email to ${to} successfully.`);
      return true;
    } catch (error) {
      console.error('[Email Service] Error sending email:', error);
      // Fallback to console log on error
    }
  }

  // Fallback / Development logging
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│                    EMAIL SERVICE (DEV MOCK)             │');
  console.log(`│ To:      ${to.padEnd(46)} │`);
  console.log(`│ Subject: ${subject.padEnd(46)} │`);
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│ Body:                                                  │`);
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
  return true;
}

/**
 * Sends an SMS using Twilio or logs it to the console if configuration is missing.
 */
async function sendSMS(to, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body,
        from: TWILIO_PHONE_NUMBER,
        to,
      });
      console.log(`[SMS Service] Sent SMS to ${to} successfully.`);
      return true;
    } catch (error) {
      console.error('[SMS Service] Error sending SMS:', error);
      // Fallback to console log on error
    }
  }

  // Fallback / Development logging
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│                     SMS SERVICE (DEV MOCK)             │');
  console.log(`│ To:   ${to.padEnd(48)} │`);
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│ Body:                                                  │`);
  const lines = body.split('\n');
  for (const line of lines) {
    console.log(`│ ${line.padEnd(54)} │`);
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
  return true;
}

module.exports = {
  generateOTP,
  verifyOTP,
  sendEmail,
  sendSMS,
};
