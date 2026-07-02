const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qualifications: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  personalInfo: {
    type: DataTypes.JSON, // Stores other personal details like contact details, links, etc.
    allowNull: true,
  },
  photoPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileUrl: {
    type: DataTypes.STRING, // Link to the generated resume PDF
    allowNull: true,
  }
});

module.exports = Resume;
