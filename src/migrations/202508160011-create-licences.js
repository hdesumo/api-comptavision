module.exports = {
  async up(q, S) {
    await q.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await q.createTable('licences', {
      id: { type: S.UUID, primaryKey: true, defaultValue: S.literal('gen_random_uuid()') },
      cabinet_id: { type: S.UUID, allowNull: true, references: { model: 'cabinets', key: 'id' } },
      license_key: { type: S.STRING, allowNull: false, unique: true },
      plan: { type: S.STRING, allowNull: false, defaultValue: 'standard' },
      seats: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      max_activations: { type: S.INTEGER, allowNull: false, defaultValue: 3 },
      activations_count: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      start_at: { type: S.DATE, allowNull: false },
      end_at: { type: S.DATE, allowNull: false },
      status: { type: S.ENUM('active','expired','suspended'), allowNull: false, defaultValue: 'active' },
      notes: { type: S.TEXT },
      created_at: { type: S.DATE, defaultValue: S.fn('now') },
      updated_at: { type: S.DATE, defaultValue: S.fn('now') }
    });
  },
  async down(q) {
    await q.dropTable('licences');
    await q.sequelize.query('DROP TYPE IF EXISTS "enum_licences_status";');
  }
};

