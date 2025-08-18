const { Licence } = require('../models');
const crypto = require('crypto');

function chunk(str, size){ return str.match(new RegExp('.{1,'+size+'}', 'g')); }
function generateKey(prefix='CV'){
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 hex = 8 bytes
  return [prefix, ...chunk(raw, 4)].join('-');                      // CV-ABCD-EF12-...
}

function now(){ return new Date(); }
function addMonths(d, m){ const x=new Date(d); x.setMonth(x.getMonth()+m); return x; }

async function ensureStatus(lic){
  if (lic.status === 'suspended') return lic;
  if (new Date(lic.end_at) < now() && lic.status !== 'expired') {
    await lic.update({ status: 'expired' });
  }
  return lic;
}

exports.create = async ({ cabinet_id=null, plan='standard', seats=1, months=12, start_at=null, notes=null }) => {
  const key = generateKey('CV');
  const start = start_at ? new Date(start_at) : now();
  const end = addMonths(start, months);
  return Licence.create({
    cabinet_id, license_key: key, plan, seats,
    start_at: start, end_at: end, status: 'active', notes
  });
};

exports.validate = async (license_key) => {
  const lic = await Licence.findOne({ where: { license_key } });
  if (!lic) return { ok:false, reason:'not_found' };
  await ensureStatus(lic);
  if (lic.status !== 'active') return { ok:false, reason:lic.status };
  if (new Date(lic.start_at) > now()) return { ok:false, reason:'not_started' };
  if (new Date(lic.end_at) < now())  return { ok:false, reason:'expired' };
  return { ok:true, licence: lic };
};

exports.activate = async ({ license_key, cabinet_id=null }) => {
  const check = await exports.validate(license_key);
  if (!check.ok) return check;
  const lic = check.licence;
  if (cabinet_id && !lic.cabinet_id) await lic.update({ cabinet_id }); // binder au 1er usage
  if (lic.activations_count >= lic.max_activations) return { ok:false, reason:'activation_limit' };
  await lic.update({ activations_count: lic.activations_count + 1 });
  return { ok:true, licence: lic };
};

exports.extend = async ({ id, months=12, seats=null, status=null, end_at=null, notes=null }) => {
  const lic = await Licence.findByPk(id);
  if (!lic) return null;
  const newEnd = end_at ? new Date(end_at) : addMonths(lic.end_at, months);
  const patch = { end_at: newEnd };
  if (seats!=null) patch.seats = seats;
  if (status) patch.status = status;
  if (notes!=null) patch.notes = notes;
  await lic.update(patch);
  return lic;
};

