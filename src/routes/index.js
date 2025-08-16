const express = require('express');
const router = express.Router();

// Exemple de route
router.get('/', (req, res) => {
  res.json({ message: 'API ComptaVision OK' });
});

module.exports = router;

