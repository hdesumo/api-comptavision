// src/models/license.js
'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const License = sequelize.define('License', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    license_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    max_users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'revoked', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    start_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    end_date: { type: DataTypes.DATE, allowNull: false },
  }, {
    tableName: 'licenses',
    underscored: true,
    timestamps: true, // created_at / updated_at
  });

  // License.associate = (models) => { ... };

  return License;
};

