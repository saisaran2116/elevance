const { User } = require('../models');

const PLANS = {
  Free: { applications: 1 },
  Bronze: { applications: 3 },
  Silver: { applications: 5 },
  Gold: { applications: -1 }, // -1 for unlimited
};

async function checkApplicationLimit(req, res, next) {
  try {
    const user = req.user; // Set by auth middleware
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the plan is valid
    const planConfig = PLANS[user.currentPlan || 'Free'];
    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Reset logic: if it's been more than a month since last reset
    const now = new Date();
    const lastReset = new Date(user.lastPlanResetDate);
    const timeDiff = now.getTime() - lastReset.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff >= 30) {
      // Reset application count
      user.monthlyApplicationsCount = 0;
      user.lastPlanResetDate = now;
      await user.save();
    }

    // Check application limit (-1 means unlimited)
    if (planConfig.applications !== -1 && user.monthlyApplicationsCount >= planConfig.applications) {
      return res.status(403).json({ 
        error: 'Application limit reached for your current plan.',
        upgradeUrl: '/pricing.html'
      });
    }

    // Since we are checking before applying, we should ideally increment the count in the actual route handler after a successful application.
    // So we just attach a helper function to req to let the route handler increment it easily.
    req.incrementApplicationCount = async () => {
      user.monthlyApplicationsCount += 1;
      await user.save();
    };

    next();
  } catch (error) {
    console.error('Check Application Limit Error:', error);
    res.status(500).json({ error: 'Server error while checking application limits' });
  }
}

module.exports = { checkApplicationLimit };
