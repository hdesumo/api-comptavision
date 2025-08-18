// src/route/adminRoutes.js
const router = require('express').Router();
// ⚠️ Dossier Controllers avec majuscule + extension .js
const lic = require('../Controllers/licenceController.js');

// PAS de /login ici (géré dans server.mjs)
router.post('/licenses', lic.adminCreate);
router.get('/licenses', lic.adminList);
router.get('/licenses/:id', lic.adminGet);
router.patch('/licenses/:id', lic.adminUpdate);

module.exports = router;

