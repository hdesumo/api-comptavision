'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('affiliate_links', {
      id: { type: S.UUID, allowNull: false, primaryKey: true, defaultValue: S.UUIDV4 },
      affiliate_id: { type: S.UUID, allowNull: false, references: { model: 'affiliates', key: 'id' }, onDelete: 'cascade' },
      code: { type: S.STRING(40), allowNull: false, unique: true },
      landing_url: { type: S.STRING(512), allowNull: true },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
    });
    await q.addIndex('affiliate_links', ['affiliate_id'], { name: 'idx_affiliate_links_affiliate_id' });
    await q.addIndex('affiliate_links', ['code'], { unique: true, name: 'uidx_affiliate_links_code' });
  },
  async down(q) {
    await q.dropTable('affiliate_links');
  }
};

