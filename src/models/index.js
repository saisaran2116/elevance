const sequelize = require('./db');
const User = require('./User');
const LoginHistory = require('./LoginHistory');
const Subscription = require('./Subscription');
const Resume = require('./Resume');
const Post = require('./Post');
const OTP = require('./OTP');
const Friend = require('./Friend');
const PasswordReset = require('./PasswordReset');
const Comment = require('./Comment');
const Like = require('./Like');

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

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  LoginHistory,
  Subscription,
  Resume,
  Post,
  OTP,
  Friend,
  PasswordReset,
  Comment,
  Like
};
