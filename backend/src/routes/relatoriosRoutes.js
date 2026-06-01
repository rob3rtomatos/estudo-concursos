const { Router }     = require('express');
const ctrl           = require('../controllers/relatoriosController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);
router.get('/gerar', ctrl.gerar);

module.exports = router;
