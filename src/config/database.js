// src/config/database.js
const { Sequelize } = require('sequelize');

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required (set it on your Railway backend service).');
}

// Par défaut en prod Railway, on met SSL=true.
// Tu peux forcer via DB_SSL=false si besoin (rare).
const ssl =
  String(process.env.DB_SSL ?? 'true').trim().toLowerCase() === 'true';

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false,
  pool: { max: 10, min: 0, idle: 10_000, acquire: 60_000 },
});

// Option utile: test de connexion au démarrage
async function assertDbConnection() {
  await sequelize.authenticate();
}

module.exports = { sequelize, assertDbConnection };

