'use strict';
const express = require('express');
const router = express.Router();

const { Affiliate, AffiliateLink, Commission } = require('../../models');
const { setReferralCookie } = require('../../lib/affiliates');
// Si tu as une auth middleware admin :
const { requireAuth, requireRole } = (() => {
  try { return require('../../middleware/auth'); } catch { return { requireAuth: (_r,_s,n)=>n(), requireRole:()=> (_r,_s,n)=>n() }; }
})();

// ---------- Public tracking ----------
// POST /api/v1/aff/ref/:code   → pose cookie ref
router.post('/ref/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  const link = await AffiliateLink.findOne({ where: { code }, include: [{ model: Affiliate, as: 'affiliate' }] });
  if (!link || !link.affiliate || link.affiliate.status !== 'active') {
    return res.status(404).json({ ok: false, error: 'Invalid referral code' });
  }

  const ttl = Number(link.affiliate.cookie_ttl_days || 30);
  setReferralCookie(res, code, ttl);
  res.json({ ok: true, code, cookie_days: ttl });
});

// ---------- Admin ----------
// Création d’un affilié
router.post('/admin/affiliates', requireAuth, requireRole('ADMIN','OWNER'), async (req, res) => {
  const { name, email, commission_rate_bps = 2000, cookie_ttl_days = 30 } = req.body || {};
  const exists = await Affiliate.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Affiliate already exists' });
  const affiliate = await Affiliate.create({ name, email, commission_rate_bps, cookie_ttl_days, status: 'active' });
  res.status(201).json({ affiliate });
});

// Création d’un lien d’affiliation
router.post('/admin/affiliates/:id/links', requireAuth, requireRole('ADMIN','OWNER'), async (req, res) => {
  const affiliate = await Affiliate.findByPk(req.params.id);
  if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });
  const { code, landing_url } = req.body || {};
  const exists = await AffiliateLink.findOne({ where: { code } });
  if (exists) return res.status(409).json({ error: 'Code already in use' });
  const link = await AffiliateLink.create({ affiliate_id: affiliate.id, code, landing_url });
  res.status(201).json({ link });
});

// Liste des commissions (filtrable)
router.get('/admin/commissions', requireAuth, requireRole('ADMIN','OWNER'), async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const items = await Commission.findAll({
    where,
    order: [['created_at','DESC']],
    limit: Math.min(parseInt(req.query.limit || '100', 10), 500)
  });
  res.json({ items });
});

// Maj statut commission
router.patch('/admin/commissions/:id', requireAuth, requireRole('ADMIN','OWNER'), async (req, res) => {
  const c = await Commission.findByPk(req.params.id);
  if (!c) return res.status(404).json({ error: 'Commission not found' });
  const { status } = req.body || {};
  if (!['pending','approved','paid','canceled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  c.status = status;
  await c.save();
  res.json({ commission: c });
});

module.exports = router;

