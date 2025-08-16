require('dotenv').config();

const cfg = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {}
};
if ((process.env.DB_SSL || 'true').toLowerCase() === 'true') {
  cfg.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
}

module.exports = {
  development: { ...cfg, use_env_variable: 'DATABASE_URL' },
  test:        { ...cfg, use_env_variable: 'DATABASE_URL' },
  production:  { ...cfg, use_env_variable: 'DATABASE_URL' }
};
