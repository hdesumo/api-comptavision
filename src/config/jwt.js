// src/config/jwt.js
const jwt = require('jsonwebtoken');

const secret = (process.env.JWT_SECRET || '').trim();
if (!secret) {
  throw new Error('JWT_SECRET is required in production (set it on your Railway backend service).');
}

const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

const sign = (payload, options = {}) =>
  jwt.sign(payload, secret, { expiresIn, ...options });

const verify = (token, options = {}) =>
  jwt.verify(token, secret, options);

module.exports = { secret, expiresIn, sign, verify };

