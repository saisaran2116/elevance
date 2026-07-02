const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  os: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  device: {
    type: DataTypes.STRING, // desktop, laptop, mobile
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  attemptTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Success', 'Failed', 'Pending_OTP'),
    defaultValue: 'Success',
  }
});

module.exports = LoginHistory;
