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
