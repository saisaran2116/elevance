const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();
require('pg'); // Explicitly require pg so Vercel includes it

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: false, // set to console.log to see SQL queries
    });

module.exports = sequelize;
