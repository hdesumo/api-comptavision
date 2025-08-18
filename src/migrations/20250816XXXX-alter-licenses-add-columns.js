// ex: 20250816XXXX-alter-licenses-add-columns.js
module.exports = {
  async up(q, S) {
    // Ajouts idempotents
    const table = 'licenses';
    await q.addColumn(table, 'plan', { type: S.STRING, allowNull: false, defaultValue: 'standard' }).catch(()=>{});
    await q.addColumn(table, 'max_activations', { type: S.INTEGER, allowNull: false, defaultValue: 3 }).catch(()=>{});
    await q.addColumn(table, 'activations_count', { type: S.INTEGER, allowNull: false, defaultValue: 0 }).catch(()=>{});
    await q.addColumn(table, 'notes', { type: S.TEXT, allowNull: true }).catch(()=>{});
    await q.changeColumn(table, 'client_id', { type: S.UUID, allowNull: true }).catch(()=>{});
  },
  async down(q) {
    const table = 'licenses';
    await q.removeColumn(table, 'plan').catch(()=>{});
    await q.removeColumn(table, 'max_activations').catch(()=>{});
    await q.removeColumn(table, 'activations_count').catch(()=>{});
    await q.removeColumn(table, 'notes').catch(()=>{});
    // remettre client_id NOT NULL seulement si c'était la contrainte d'origine
  }
};

