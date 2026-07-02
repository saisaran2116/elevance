const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mediaUrl: {
    type: DataTypes.STRING, // Path to uploaded photo or video
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'text'),
    defaultValue: 'text',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});

module.exports = Post;
