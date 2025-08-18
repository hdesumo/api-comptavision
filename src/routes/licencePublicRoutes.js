const router = require('express').Router();
const ctrl = require('../controllers/licenceController');
const rateLimit = require('../middlewares/rateLimit');

router.get('/validate', rateLimit, ctrl.publicValidate);
router.post('/activate', rateLimit, ctrl.publicActivate);

module.exports = router;

