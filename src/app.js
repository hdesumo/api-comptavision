const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));

