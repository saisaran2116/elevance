# Elevance Internship Platform

A premium internship application platform with advanced features including:
- **Multi-language support** (English, Spanish, Hindi, Portuguese, Chinese, French) with OTP verification.
- **Resume Creation section** (Premium, ₹50 via Razorpay with email verification).
- **Forgot Password flow** with custom password generator and 1 request/day limit.
- **Public Space** for sharing photos/videos with post limits based on friends count.
- **Detailed User Login Tracking** (browser, OS, device, IP) with Chrome email OTP verification and mobile login time locks (10 AM - 1 PM).
- **Subscription plans** (Free, Bronze, Silver, Gold) with time-restricted payment windows (10 AM - 11 AM IST).

## Tech Stack
- **Backend:** Node.js, Express, Sequelize, SQLite3
- **Frontend:** HTML, CSS, Vanilla JS

## Day 4: Conditional Login Access Security
We have implemented strict conditional login policies based on browser and device environments:
1. **Google Chrome Login (MFA via OTP)**: If a user signs in via Google Chrome, an email OTP is triggered and required. The user is only logged in and granted a session after verifying the OTP code.
2. **Mobile Login Time Lock**: If a user signs in from a mobile device, access is strictly limited to 10:00 AM - 1:00 PM IST (using the `Asia/Kolkata` timezone). Access attempts outside this window are blocked and recorded as failed.

## Day 5: Forgot Password API & Rate Limiting
We have implemented a Forgot Password flow that allows users to reset their passwords using either their registered email or phone number:
1. **Endpoint**: `POST /api/auth/forgot-password`
2. **Custom Password Generator**: Generates a secure random 12-character password with at least one uppercase letter, one lowercase letter, one number, and one special character.
3. **1 Request/Day Rate Limit**: Restricts users to only 1 request per day (24-hour window) per user/identity. If a user attempts it more than once, it blocks the request and returns the warning message: `"You can use this option only once per day."`.
4. **Verification**: Run `node src/utils/testForgotPassword.js` to run the automated test suite.

## Day 6: Custom Password Generation & UI
We have completed the Forgot Password feature by building the dedicated UI flow:
1. **Dedicated UI Page**: Built `public/forgot-password.html` with a glassmorphism style card, email/phone selectors, and seamless redirection. Added an option to copy the generated password.
2. **Strict Custom Password Generator**: Modified `generateCustomPassword` to generate passwords consisting **strictly of uppercase and lowercase letters** (no numbers or special characters are included).
3. **Database Integration**: Plaintext passwords are automatically hashed with bcrypt, stored in the SQLite database, and returned in the HTTP response JSON to display on the client UI.
4. **Verification**: Checked via automated tests and manual UI testing.

## Day 7: Internationalization (i18n) Setup
We have integrated multi-language support (English, Spanish, Hindi, Portuguese, Chinese, French) across the entire platform:
1. **i18n Library**: Integrated `i18next` via CDN to handle client-side translations.
2. **Translation Resources**: Created structured JSON resources in `public/locales/` for English (`en.json`), Spanish (`es.json`), Hindi (`hi.json`), Portuguese (`pt.json`), Chinese (`zh.json`), and French (`fr.json`).
3. **Language Selector**: Added interactive dropdown selectors to both `public/index.html` and `public/forgot-password.html` styled to match the dark glassmorphism theme.
4. **Backend Sync & Persistence**: Added a backend `PUT /api/auth/language` route and handler in `authController.js` to persist preferred language to the SQLite database. Switched languages dynamically reflect immediately on the frontend and are restored upon page reload or login.
5. **Verification**: Tested manually via the dropdown selector and verified that DB updates occur correctly.

