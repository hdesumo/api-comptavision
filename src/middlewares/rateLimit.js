// src/middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 30,              // 30 req/min/IP
  standardHeaders: true,
  legacyHeaders: false,
});

