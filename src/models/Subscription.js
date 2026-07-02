const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  planName: {
    type: DataTypes.ENUM('Free', 'Bronze', 'Silver', 'Gold'),
    allowNull: false,
  },
  amountPaid: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // succeeded, pending, failed
    allowNull: false,
  },
  paymentGateway: {
    type: DataTypes.STRING, // Stripe, Razorpay
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invoiceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = Subscription;
