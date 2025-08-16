'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('commissions', {
      id: { type: S.UUID, allowNull: false, primaryKey: true, defaultValue: S.UUIDV4 },
      affiliate_id: { type: S.UUID, allowNull: false, references: { model: 'affiliates', key: 'id' }, onDelete: 'restrict' },
      license_id: { type: S.UUID, allowNull: false, references: { model: 'licenses', key: 'id' }, onDelete: 'restrict' },
      amount_cents: { type: S.INTEGER, allowNull: false },
      currency: { type: S.STRING(8), allowNull: false, defaultValue: 'XAF' },
      status: { type: S.ENUM('pending','approved','paid','canceled'), allowNull: false, defaultValue: 'pending' },
      attributed_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
      notes: { type: S.STRING(512), allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
    });
    await q.addIndex('commissions', ['affiliate_id'], { name: 'idx_commissions_affiliate' });
    await q.addIndex('commissions', ['license_id'], { name: 'idx_commissions_license' });
    await q.addIndex('commissions', ['status'], { name: 'idx_commissions_status' });
  },
  async down(q) {
    await q.dropTable('commissions');
  }
};

