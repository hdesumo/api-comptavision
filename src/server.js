import adminRoutes from './Route/adminroutes.js';
import licencePublicRoutes from './Route/licencepublicroutes.js';
import affRoutes from './Route/aff/index.js';
// ------------------------------------

// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Sequelize, DataTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';

/* ===========================
   Configuration
=========================== */
const PORT = process.env.PORT || 8080;

// CORS (origines autorisées, séparées par des virgules)
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const corsOptions = origins.length
  ? { origin: origins, credentials: true }
  : { origin: true, credentials: true }; // en dev: tout autoriser

// DB
const DATABASE_URL = process.env.DATABASE_URL;
const DB_SSL = String(process.env.DB_SSL || 'true').toLowerCase() === 'true';

// Auth admin (login)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@comptavision.net';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
// JWT
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-please';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'; // ex: '7d', '24h'

/* ===========================
   Connexion Sequelize
=========================== */
let sequelize = null;
if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL manquant. Le serveur démarre sans DB.');
} else {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  });
}

/* ===========================
   Modèles
=========================== */
let License = null;

if (sequelize) {
  License = sequelize.define('License', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    plan: { type: DataTypes.STRING(50), allowNull: false },
    seats: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    months: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
    notes: { type: DataTypes.TEXT, allowNull: true },

    activations_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    max_activations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },

    start_at: { type: DataTypes.DATE, allowNull: false },
    end_at: { type: DataTypes.DATE, allowNull: false },

    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }, // active|expired|suspended...

    cabinet_id: { type: DataTypes.STRING(64), allowNull: true },
    client_id: { type: DataTypes.STRING(64), allowNull: true },
  }, {
    tableName: 'licenses',
    underscored: true,
    timestamps: true, // created_at / updated_at
  });
}

/* ===========================
   App & middlewares
=========================== */
const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());

// --- AJOUTER DANS server.js ---
app.use('/api/aff', affRoutes);
app.use('/api/public', licencePublicRoutes);

/* ===========================
   Helpers
=========================== */

// JWT: émettre un token
function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// JWT: middleware de protection
function authGuard(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Non autorisé' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Jeton invalide ou expiré' });
  }
}

// Util: parse int sûr
function toInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}

// Util: ajouter N mois à une date
function addMonths(date, months) {
  const d = new Date(date);
  const m = d.getMonth() + months;
  d.setMonth(m);
  return d;
}

/* ===========================
   Routes publiques
=========================== */

// Santé
app.get('/status', (_req, res) => {
  res.json({ status: 'API Comptavision OK', timestamp: new Date().toISOString() });
});

// Login admin (compare avec ADMIN_EMAIL / ADMIN_PASSWORD)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = issueToken({ sub: email, role: 'admin' });
    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ===========================
   Routes protégées (Licences)
=========================== */

// Liste des licences (avec filtres simples facultatifs)
app.get('/api/admin/licenses', authGuard, async (req, res) => {
  try {
    if (!License) return res.json([]); // si pas de DB, retourne vide

    const { q, status } = req.query || {};
    const where = {};
    if (status) where.status = String(status);

    if (q) {
      const like = `%${String(q)}%`;
      where[Op.or] = [
        { plan: { [Op.iLike]: like } },
        { notes: { [Op.iLike]: like } },
        { cabinet_id: { [Op.iLike]: like } },
        { client_id: { [Op.iLike]: like } },
      ];
    }

    const rows = await License.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (err) {
    console.error('GET /licenses:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des licences.' });
  }
});

// Création d’une licence
app.post('/api/admin/licenses', authGuard, async (req, res) => {
  try {
    if (!License) return res.status(503).json({ error: 'Base de données indisponible.' });

    const { plan, seats, months, notes, cabinet_id, client_id } = req.body || {};
    const s = toInt(seats, 1);
    const m = toInt(months, 12);

    if (!plan || s <= 0 || m <= 0) {
      return res.status(400).json({ error: 'Paramètres invalides.' });
    }

    const now = new Date();
    const end = addMonths(now, m);

    const lic = await License.create({
      plan: String(plan),
      seats: s,
      months: m,
      notes: notes || '',
      activations_count: 0,
      max_activations: s,
      start_at: now,
      end_at: end,
      status: 'active',
      cabinet_id: cabinet_id || null,
      client_id: client_id || null,
    });

    res.status(201).json(lic);
  } catch (err) {
    console.error('POST /licenses:', err);
    res.status(500).json({ error: 'Erreur lors de la création.' });
  }
});

// Mise à jour d’une licence
app.put('/api/admin/licenses/:id', authGuard, async (req, res) => {
  try {
    if (!License) return res.status(503).json({ error: 'Base de données indisponible.' });

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalide.' });

    const lic = await License.findByPk(id);
    if (!lic) return res.status(404).json({ error: 'Licence introuvable.' });

    const allowed = ['plan', 'seats', 'months', 'notes', 'status', 'cabinet_id', 'client_id', 'start_at', 'end_at'];
    const patch = {};
    for (const k of allowed) {
      if (k in req.body) patch[k] = req.body[k];
    }

    // si seats change, MAJ max_activations
    if (patch.seats != null) patch.max_activations = toInt(patch.seats, lic.seats || 1);

    // si months change et pas de dates custom envoyées, MAJ end_at par rapport à start_at existant
    if (patch.months != null && patch.end_at == null) {
      const m = toInt(patch.months, lic.months || 12);
      const baseStart = patch.start_at ? new Date(patch.start_at) : new Date(lic.start_at);
      patch.end_at = addMonths(baseStart, m);
    }

    await lic.update(patch);
    res.json(lic);
  } catch (err) {
    console.error('PUT /licenses/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// Suppression d’une licence
app.delete('/api/admin/licenses/:id', authGuard, async (req, res) => {
  try {
    if (!License) return res.status(503).json({ error: 'Base de données indisponible.' });

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalide.' });

    const lic = await License.findByPk(id);
    if (!lic) return res.status(404).json({ error: 'Licence introuvable.' });

    await lic.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /licenses/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

/* ===========================
   Démarrage
=========================== */
(async () => {
  try {
    if (sequelize) {
      await sequelize.authenticate();
      console.log('✅ DB: connexion OK');

      // Création/MAJ automatique du schéma (production-ready pour ton usage RailWay)
      await sequelize.sync({ alter: true });
      console.log('✅ DB: schéma synchronisé');
    } else {
      console.log('⚠️  DB: non configurée (pas de DATABASE_URL). Les routes Licences renverront 503.');
    }
  } catch (err) {
    console.error('❌ DB: connexion/sync impossible:', err?.message || err);
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();

