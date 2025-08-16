'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Commission = sequelize.define('Commission', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    affiliate_id: { type: DataTypes.UUID, allowNull: false },
    license_id: { type: DataTypes.UUID, allowNull: false },
    amount_cents: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'XAF' },
    status: { type: DataTypes.ENUM('pending','approved','paid','canceled'), allowNull: false, defaultValue: 'pending' },
    attributed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    notes: { type: DataTypes.STRING(512) },
  }, {
    tableName: 'commissions',
    underscored: true,
    timestamps: true,
  });

  Commission.associate = (models) => {
    Commission.belongsTo(models.Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate' });
    // Si tu as un model License côté Sequelize :
    // Commission.belongsTo(models.License, { foreignKey: 'license_id', as: 'license' });
  };

  return Commission;
};

