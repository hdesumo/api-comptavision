const licenceSvc = require('../services/licenceService');
const { Licence } = require('../models');
const { Op } = require('sequelize');

exports.adminCreate = async (req,res,next) => {
  try {
    const { cabinet_id, plan, seats, months, start_at, notes } = req.body;
    const lic = await licenceSvc.create({ cabinet_id, plan, seats, months, start_at, notes });
    res.status(201).json(lic);
  } catch(e){ next(e); }
};

exports.adminList = async (req,res,next) => {
  try {
    const { q, status, cabinet_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (cabinet_id) where.cabinet_id = cabinet_id;
    if (q) where[Op.or] = [
      { license_key: { [Op.iLike]: `%${q}%` } },
      { plan: { [Op.iLike]: `%${q}%` } }
    ];
    const rows = await Licence.findAll({ where, order:[['created_at','DESC']], limit:100 });
    res.json(rows);
  } catch(e){ next(e); }
};

exports.adminGet = async (req,res,next) => {
  try {
    const lic = await Licence.findByPk(req.params.id);
    if (!lic) return res.status(404).json({ error:'Not found' });
    res.json(lic);
  } catch(e){ next(e); }
};

exports.adminUpdate = async (req,res,next) => {
  try {
    const { months, seats, status, end_at, notes } = req.body;
    const lic = await licenceSvc.extend({ id: req.params.id, months, seats, status, end_at, notes });
    if (!lic) return res.status(404).json({ error:'Not found' });
    res.json(lic);
  } catch(e){ next(e); }
};

exports.publicValidate = async (req,res,next) => {
  try {
    const { license_key } = req.query;
    const result = await licenceSvc.validate(license_key);
    const code = result.ok ? 200 : 400;
    res.status(code).json(result);
  } catch(e){ next(e); }
};

exports.publicActivate = async (req,res,next) => {
  try {
    const { license_key, cabinet_id } = req.body;
    const result = await licenceSvc.activate({ license_key, cabinet_id });
    const code = result.ok ? 200 : 400;
    res.status(code).json(result);
  } catch(e){ next(e); }
};

