const sequelize = require('./db');
const User = require('./User');
const LoginHistory = require('./LoginHistory');
const Subscription = require('./Subscription');
const Resume = require('./Resume');
const Post = require('./Post');
const OTP = require('./OTP');
const Friend = require('./Friend');
const PasswordReset = require('./PasswordReset');

// Associations
User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories' });
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' });
Resume.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Self-referential relationship for Friends (user acts as either requester or receiver)
User.belongsToMany(User, { 
  through: Friend, 
  as: 'friends', 
  foreignKey: 'userId', 
  otherKey: 'friendId' 
});

module.exports = {
  sequelize,
  User,
  LoginHistory,
  Subscription,
  Resume,
  Post,
  OTP,
  Friend,
  PasswordReset
};
