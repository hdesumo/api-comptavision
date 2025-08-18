// src/server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';

const app = express();

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS || '';
  const whitelist = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (whitelist.length === 0) return { origin: true, credentials: true };
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = whitelist.some(w => (w.startsWith('*.') && origin.endsWith(w.slice(1))) || origin === w);
      return allowed ? callback(null, true) : callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'API Comptavision OK', timestamp: new Date().toISOString() });
});

// === LOGIN ADMIN
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) return res.status(500).json({ error: 'JWT_SECRET is not set' });
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: 'admin', email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
  res.json({ token });
});

// Démarre d’abord le serveur (même si une route casse)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 API Comptavision running on port ${PORT}`));

// Monte ensuite les routes en async (logs clairs si ça échoue)
(async () => {
  try {
    // ⚠️ MINUSCULES : src/route/...
    const { default: adminRoutes }         = await import('./route/adminRoutes.js');
    const { default: licencePublicRoutes } = await import('./route/licencePublicRoutes.js');
    const { default: affRoutes }           = await import('./route/aff/index.js');

    app.use('/api/admin',  adminRoutes);          // /licenses*, PAS /login ici
    app.use('/api/public', licencePublicRoutes);  // /validate, /activate
    app.use('/api/aff',    affRoutes);            // routes aff

    console.log('✅ Routes montées');

    // 404 après montage
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found', path: req.originalUrl });
    });

  } catch (err) {
    console.error('❌ Échec import des routes:', err?.stack || err);
    app.use((req, res) => {
      res.status(503).json({ error: 'Routes not loaded', details: String(err?.message || err) });
    });
  }

  app.use((err, req, res, next) => {
    console.error('❌ Error:', err?.stack || err?.message || err);
    res.status(err.status || 500).json({ error: err?.message || 'Internal Server Error' });
  });
})();

