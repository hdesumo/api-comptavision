'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('affiliates', {
      id: { type: S.UUID, allowNull: false, primaryKey: true, defaultValue: S.UUIDV4 },
      name: { type: S.STRING(120), allowNull: false },
      email: { type: S.STRING(160), allowNull: false, unique: true },
      status: { type: S.ENUM('active','suspended'), allowNull: false, defaultValue: 'active' },
      commission_rate_bps: { type: S.INTEGER, allowNull: false, defaultValue: 2000 }, // 20%
      cookie_ttl_days: { type: S.INTEGER, allowNull: false, defaultValue: 30 },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
    });
    await q.addIndex('affiliates', ['email'], { unique: true, name: 'uidx_affiliates_email' });
    await q.addIndex('affiliates', ['status'], { name: 'idx_affiliates_status' });
  },
  async down(q) {
    await q.dropTable('affiliates');
  }
};

