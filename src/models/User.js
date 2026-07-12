const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en', // en, es, hi, pt, zh, fr
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  currentPlan: {
    type: DataTypes.ENUM('Free', 'Bronze', 'Silver', 'Gold'),
    defaultValue: 'Free',
  },
  monthlyApplicationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  applicationsLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 3, // Default for free/bronze or whatever
  },
  lastPlanResetDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

module.exports = User;
