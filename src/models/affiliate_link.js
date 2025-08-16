'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AffiliateLink = sequelize.define('AffiliateLink', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    affiliate_id: { type: DataTypes.UUID, allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    landing_url: { type: DataTypes.STRING(512), allowNull: true },
  }, {
    tableName: 'affiliate_links',
    underscored: true,
    timestamps: true,
  });

  AffiliateLink.associate = (models) => {
    AffiliateLink.belongsTo(models.Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate' });
  };

  return AffiliateLink;
};

