// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: useSSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
    })
  : new Sequelize(
      process.env.DB_NAME || 'comptavision',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        logging: false,
        dialectOptions: useSSL
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {}
      }
    );

module.exports = sequelize;

