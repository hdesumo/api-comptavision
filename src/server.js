// src/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { sequelize } = require('./models'); // Sequelize index.js
const routes = require('./routes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'API Comptavision OK', timestamp: new Date() });
});

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to the database.');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

