// src/services/licenceService.js
const crypto = require('crypto');
const { Licence } = require('../models');
const { Op } = require('sequelize');

function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + Number(months));
  if (d.getDate() < day) d.setDate(0);
  return d;
}

async function generateUniqueKey() {
  const prefix = `CV-${new Date().toISOString().slice(0,7).replace('-','')}`; // CV-YYYYMM
  for (let i = 0; i < 5; i++) {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    const key = `${prefix}-${rand}`;
    const exists = await Licence.findOne({ where: { license_key: key } });
    if (!exists) return key;
  }
  const rand = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
}

async function create({ cabinet_id, plan, seats, months, start_at, notes }) {
  if (!plan) throw new Error('plan is required');
  if (!seats || Number(seats) <= 0) throw new Error('seats must be > 0');
  if (!months || Number(months) <= 0) throw new Error('months must be > 0');

  const license_key = await generateUniqueKey();

  const start = start_at ? new Date(start_at) : new Date();
  const end = addMonths(start, months);

  const lic = await Licence.create({
    license_key,
    cabinet_id: cabinet_id || null,
    plan,
    seats: Number(seats),
    months: Number(months),
    start_at: start,
    end_at: end,
    status: 'active',
    notes: notes || null,
  });

  return lic;
}

async function extend({ id, months, seats, status, end_at, notes }) {
  const lic = await Licence.findByPk(id);
  if (!lic) return null;

  if (months && Number(months) > 0) {
    const base = lic.end_at ? new Date(lic.end_at) : new Date();
    lic.end_at = addMonths(base, Number(months));
    lic.months = (Number(lic.months) || 0) + Number(months);
    if (!lic.start_at) lic.start_at = new Date();
    if (!lic.status || lic.status === 'expired') lic.status = 'active';
  }

  if (typeof seats !== 'undefined') {
    if (Number(seats) <= 0) throw new Error('seats must be > 0');
    lic.seats = Number(seats);
  }
  if (typeof status !== 'undefined' && status) lic.status = String(status);
  if (typeof end_at !== 'undefined' && end_at) lic.end_at = new Date(end_at);
  if (typeof notes !== 'undefined') lic.notes = notes || null;

  await lic.save();
  return lic;
}

async function validate(license_key) {
  if (!license_key) return { ok: false, error: 'MISSING_KEY' };
  const lic = await Licence.findOne({ where: { license_key } });
  if (!lic) return { ok: false, error: 'INVALID_KEY' };

  if (lic.status && String(lic.status).toLowerCase() === 'revoked') {
    return { ok: false, error: 'REVOKED', license_key, id: lic.id };
  }

  const now = new Date();
  if (lic.end_at && new Date(lic.end_at) < now) {
    if (lic.status !== 'expired') {
      lic.status = 'expired';
      await lic.save();
    }
    return { ok: false, error: 'EXPIRED', license_key, id: lic.id, end_at: lic.end_at };
  }

  return {
    ok: true,
    license_key,
    id: lic.id,
    cabinet_id: lic.cabinet_id,
    plan: lic.plan,
    seats: lic.seats,
    months: lic.months,
    start_at: lic.start_at,
    end_at: lic.end_at,
    status: lic.status,
    notes: lic.notes,
  };
}

async function activate({ license_key, cabinet_id }) {
  if (!license_key) return { ok: false, error: 'MISSING_KEY' };
  if (!cabinet_id) return { ok: false, error: 'MISSING_CABINET_ID' };

  const lic = await Licence.findOne({ where: { license_key } });
  if (!lic) return { ok: false, error: 'INVALID_KEY' };

  if (lic.cabinet_id && String(lic.cabinet_id) !== String(cabinet_id)) {
    return { ok: false, error: 'ALREADY_BOUND', cabinet_id: lic.cabinet_id };
  }

  if (!lic.cabinet_id) lic.cabinet_id = cabinet_id;

  if (!lic.start_at) {
    lic.start_at = new Date();
    if (lic.months && Number(lic.months) > 0) {
      lic.end_at = addMonths(lic.start_at, Number(lic.months));
    } else if (!lic.end_at) {
      lic.end_at = addMonths(lic.start_at, 1);
      lic.months = 1;
    }
  }

  if (lic.status !== 'revoked') lic.status = 'active';

  await lic.save();

  return {
    ok: true,
    license_key,
    id: lic.id,
    cabinet_id: lic.cabinet_id,
    plan: lic.plan,
    seats: lic.seats,
    months: lic.months,
    start_at: lic.start_at,
    end_at: lic.end_at,
    status: lic.status,
    notes: lic.notes,
  };
}

module.exports = { create, extend, validate, activate };

