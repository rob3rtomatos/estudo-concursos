/**
 * cronometroRoutes.js - Rotas do cronômetro Pomodoro
 */

const { Router } = require('express');
const ctrl       = require('../controllers/cronometroController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);  // Todas as rotas exigem JWT

router.get('/ativa',       ctrl.buscarAtiva);
router.get('/historico',   ctrl.historico);
router.post('/iniciar',    ctrl.iniciar);
router.patch('/pausar',    ctrl.pausar);
router.patch('/encerrar',  ctrl.encerrar);

module.exports = router;
