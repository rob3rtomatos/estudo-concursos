const { Router } = require('express');
const ctrl       = require('../controllers/cronometroController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

router.get('/ativa',           ctrl.buscarAtiva);
router.get('/historico',       ctrl.historico);
router.post('/iniciar',        ctrl.iniciar);
router.patch('/pausar',        ctrl.pausar);
router.patch('/pausar-timer',  ctrl.pausarTimer);
router.patch('/retomar',       ctrl.retomarTimer);
router.patch('/encerrar',      ctrl.encerrar);
router.delete('/:id',          ctrl.removerSessao);

module.exports = router;
