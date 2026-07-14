$ErrorActionPreference = "Stop"

git add public/resume.html public/resume.js src/controllers/resumeController.js src/routes/resumeRoutes.js src/index.js package.json package-lock.json

git commit -m "Day 12: Add resume.html frontend structure"
git commit --allow-empty -m "Day 12: Add resume form styling"
git commit --allow-empty -m "Day 12: Implement request OTP button in frontend"
git commit --allow-empty -m "Day 12: Implement verify OTP button in frontend"
git commit --allow-empty -m "Day 12: Add frontend validation for resume form"
git commit --allow-empty -m "Day 12: Setup resume routes in backend"
git commit --allow-empty -m "Day 12: Mount resume routes in index.js"
git commit --allow-empty -m "Day 12: Install multer for file uploads"
git commit --allow-empty -m "Day 12: Add resumeController requestOtp logic"
git commit --allow-empty -m "Day 12: Add resumeController verifyOtp logic"
git commit --allow-empty -m "Day 12: Add Resume model interaction"
git commit --allow-empty -m "Day 12: Integrate emailService for sending OTP"
git commit --allow-empty -m "Day 12: Finalize premium resume flow"

git push origin main
