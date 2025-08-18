// src/Route/licencePublicRoutes.js
const router = require('express').Router();
const ctrl = require('../Controllers/licenceController.js');
const rateLimit = require('../middlewares/rateLimit.js');

router.get('/validate', rateLimit, ctrl.publicValidate);
router.post('/activate', rateLimit, ctrl.publicActivate);

module.exports = router;

