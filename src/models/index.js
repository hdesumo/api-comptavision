// src/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const basename = path.basename(__filename);
const db = {};

let sequelize;

// Choix connexion: via use_env_variable (DATABASE_URL) ou via champs individuels
if (config.use_env_variable && process.env[config.use_env_variable]) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect || 'postgres',
    logging: config.logging === undefined ? false : config.logging,
    dialectOptions: config.dialectOptions || {},
    pool: { max: 10, min: 0, idle: 10000, acquire: 60000 },
  });
} else if (config.url) {
  // fallback si tu as un champ "url" dans ta config (optionnel)
  sequelize = new Sequelize(config.url, {
    dialect: config.dialect || 'postgres',
    logging: config.logging === undefined ? false : config.logging,
    dialectOptions: config.dialectOptions || {},
    pool: { max: 10, min: 0, idle: 10000, acquire: 60000 },
  });
} else {
  // connexion par champs (si jamais tu gardes username/password/host dans ta config)
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect || 'postgres',
      logging: config.logging === undefined ? false : config.logging,
      dialectOptions: config.dialectOptions || {},
      pool: { max: 10, min: 0, idle: 10000, acquire: 60000 },
    }
  );
}

// Chargement auto de tous les modèles *.js (sauf index.js)
fs
  .readdirSync(__dirname)
  .filter((file) =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js'
  )
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize);
    db[model.name] = model;
  });

// Appel des associations si présentes
Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// (Optionnel) test de connexion au boot — utile pour fail-fast en prod
async function assertDbConnection() {
  await sequelize.authenticate();
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.assertDbConnection = assertDbConnection;

module.exports = db;

