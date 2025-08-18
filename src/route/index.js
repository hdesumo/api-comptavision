// routes/index.js
const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth');
const licenceRoutes = require('./licence');
const adminRoutes = require('./admin'); // à créer si pas encore fait

// Middleware de log simple (optionnel)
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Définition des préfixes d’API
router.use('/auth', authRoutes);
router.use('/licence', licenceRoutes);
router.use('/api/admin', adminRoutes);

// Gestion des routes inconnues
router.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = router;

