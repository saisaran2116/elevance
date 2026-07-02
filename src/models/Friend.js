const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Friend = sequelize.define('Friend', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  friendId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted'),
    defaultValue: 'pending',
  }
});

module.exports = Friend;
