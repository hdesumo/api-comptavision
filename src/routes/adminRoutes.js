const lic = require('../controllers/licenceController');
router.post('/licenses', lic.adminCreate);
router.get('/licenses', lic.adminList);
router.get('/licenses/:id', lic.adminGet);
router.patch('/licenses/:id', lic.adminUpdate);

