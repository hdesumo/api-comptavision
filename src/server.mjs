// src/server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';

// Tes routes/controllers/services restent en CommonJS.
// Importer un CJS dans un module ESM (.mjs) fonctionne via "default".
import adminRoutes from './Route/adminRoutes.js';
import licencePublicRoutes from './Route/licencePublicRoutes.js';
import affRoutes from './Route/aff/index.js';

const app = express();

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS || '';
  const whitelist = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (whitelist.length === 0) return { origin: true, credentials: true };

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = whitelist.some(w => {
        if (w.startsWith('*.') && origin.endsWith(w.slice(1))) return true;
        return origin === w;
      });
      return allowed ? callback(null, true)
                     : callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}

// Middlewares globaux
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'API Comptavision OK', timestamp: new Date().toISOString() });
});

// === LOGIN ADMIN (déjà validé)
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) return res.status(500).json({ error: 'JWT_SECRET is not set' });
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: 'admin', email }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
  res.json({ token });
});

// === Montage des autres routes (CJS importées en default)
app.use('/api/admin', adminRoutes);          // /licenses*, PAS /login ici
app.use('/api/public', licencePublicRoutes); // /validate, /activate
app.use('/api/aff', affRoutes);              // routes aff

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Erreurs
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 API Comptavision running on port ${PORT}`));

