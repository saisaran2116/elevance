const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('email', 'sms'),
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  target: {
    type: DataTypes.STRING, // email address or phone number
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = OTP;
