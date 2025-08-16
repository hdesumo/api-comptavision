'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Affiliate = sequelize.define('Affiliate', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('active','suspended'), allowNull: false, defaultValue: 'active' },
    commission_rate_bps: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2000 },
    cookie_ttl_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  }, {
    tableName: 'affiliates',
    underscored: true,
    timestamps: true,
  });

  Affiliate.associate = (models) => {
    Affiliate.hasMany(models.AffiliateLink, { foreignKey: 'affiliate_id', as: 'links' });
    Affiliate.hasMany(models.Commission, { foreignKey: 'affiliate_id', as: 'commissions' });
  };

  return Affiliate;
};

