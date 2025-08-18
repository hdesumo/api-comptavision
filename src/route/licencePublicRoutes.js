// src/route/licencePublicRoutes.js
const router = require('express').Router();
// ⚠️ Dossier Controllers avec majuscule + extension .js
const ctrl = require('../Controllers/licenceController.js');
// ⚠️ Middleware en minuscules (dossier "middlewares")
const rateLimit = require('../middlewares/rateLimit.js');

router.get('/validate', rateLimit, ctrl.publicValidate);
router.post('/activate', rateLimit, ctrl.publicActivate);

module.exports = router;

