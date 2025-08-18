// src/utils/cors.js
function buildCorsOptions() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const whitelist = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (whitelist.length === 0) {
    // Autorise tout en DEV si non configuré
    return { origin: true, credentials: true };
  }

  return {
    origin(origin, callback) {
      // Autorise requêtes server-to-server (sans header Origin)
      if (!origin) return callback(null, true);

      const allowed = whitelist.some(w => {
        // prise en charge des sous-domaines *.vercel.app
        if (w.startsWith('*.') && origin.endsWith(w.slice(1))) return true;
        return origin === w;
      });

      return allowed
        ? callback(null, true)
        : callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}

module.exports = { buildCorsOptions };

