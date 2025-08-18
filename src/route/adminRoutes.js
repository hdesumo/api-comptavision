// src/Route/adminRoutes.js
const router = require('express').Router();
const lic = require('../Controllers/licenceController.js');

// IMPORTANT : pas de /login ici (géré dans server.js)
router.post('/licenses', lic.adminCreate);
router.get('/licenses', lic.adminList);
router.get('/licenses/:id', lic.adminGet);
router.patch('/licenses/:id', lic.adminUpdate);

module.exports = router;

