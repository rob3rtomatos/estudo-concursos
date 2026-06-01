const { Router } = require('express');
const ctrl = require('../controllers/dashboardController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);
router.get('/resumo', ctrl.resumo);

module.exports = router;
