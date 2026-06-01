const { Router } = require('express');
const ctrl = require('../controllers/notificacoesController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

router.get('/',                    ctrl.listar);
router.patch('/:id/lida',          ctrl.marcarLida);
router.patch('/marcar-todas',      ctrl.marcarTodas);

module.exports = router;
