// src/db/sequelize-config.cjs
require('dotenv').config();

const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const common = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}
};

// Préférence à DATABASE_URL quand disponible (Railway, Supabase, etc.)
const fromUrl = { ...common, use_env_variable: 'DATABASE_URL' };

// Fallback si pas de DATABASE_URL (dév local en params séparés)
const fromParams = {
  ...common,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'comptavision',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432)
};

const configFor = () => (process.env.DATABASE_URL ? fromUrl : fromParams);

module.exports = {
  development: configFor(),
  test:        configFor(),
  production:  configFor()
};
