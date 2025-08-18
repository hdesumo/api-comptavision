'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const License = sequelize.define('License', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // Clé de licence
    license_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },

    // Liaison client/cabinet (on l'autorise à null jusqu'à la 1re activation)
    client_id: { type: DataTypes.UUID, allowNull: true },

    // Offre & capacité d'utilisation
    plan: { type: DataTypes.STRING, allowNull: false, defaultValue: 'standard' },
    max_users: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },

    // Contrôle des activations (machines/installations)
    max_activations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    activations_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Cycle de vie
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'revoked', 'expired'),
      allowNull: false,
      defaultValue: 'active'
    },
    start_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    end_date: { type: DataTypes.DATE, allowNull: false },

    // Notes internes (admin)
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'licenses',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['license_key'] },
      { fields: ['status'] },
      { fields: ['client_id'] }
    ]
  });

  return License;
};

