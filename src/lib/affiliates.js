'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Affiliate, AffiliateLink, Commission } = require('../models');

const getRefFromRequest = (req) => {
  // Priorité header → query → cookie
  const fromHeader = (req.headers['x-ref'] || req.headers['x-referral-code'] || '').toString().trim();
  if (fromHeader) return fromHeader;
  if (req.query && req.query.ref) return String(req.query.ref).trim();
  if (req.cookies && req.cookies.ref) return String(req.cookies.ref).trim();
  return '';
};

const setReferralCookie = (res, code, days) => {
  const maxAge = Math.max(1, days) * 24 * 60 * 60 * 1000;
  res.cookie('ref', code, {
    httpOnly: false,
    sameSite: 'Lax',
    secure: true,
    maxAge,
    path: '/',
  });
};

const safeCents = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.round(x);
};

/**
 * Calcule et enregistre une commission si un ref valide existe dans la requête.
 * @param {{ id: string }} license  - l'objet Licence créé/activé (doit contenir id)
 * @param {import('express').Request} req
 * @param {object} opts - { baseAmountCents, currency }
 */
async function createCommissionIfAny(license, req, opts = {}) {
  const code = getRefFromRequest(req);
  if (!code) return null;

  // Trouver le lien + l'affilié
  const link = await AffiliateLink.findOne({
    where: { code },
    include: [{ model: Affiliate, as: 'affiliate', required: true, where: { status: 'active' } }],
  });
  if (!link) return null;

  const affiliate = link.affiliate;

  // Évite doublon sur la même license
  const existing = await Commission.findOne({ where: { license_id: license.id } });
  if (existing) return existing;

  // Montant base (au choix) — ici on prend une base passée en opts
  const baseCents = safeCents(opts.baseAmountCents ?? 0);
  const rateBps = Number(affiliate.commission_rate_bps || 0);
  const amountCents = safeCents(baseCents * rateBps / 10000);
  const currency = (opts.currency || 'XAF').toUpperCase();

  const commission = await Commission.create({
    affiliate_id: affiliate.id,
    license_id: license.id,
    amount_cents: amountCents,
    currency,
    status: 'pending',
    attributed_at: new Date(),
    notes: `ref=${code}`,
  });

  return commission;
}

module.exports = {
  getRefFromRequest,
  setReferralCookie,
  createCommissionIfAny,
};

