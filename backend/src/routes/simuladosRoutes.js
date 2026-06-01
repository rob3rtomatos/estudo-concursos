const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/simuladosController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

const validar = [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório')
];

router.get('/',               ctrl.listar);
router.get('/:id',            ctrl.buscarUm);
router.post('/',              validar, ctrl.criar);
router.put('/:id',            validar, ctrl.atualizar);
router.delete('/:id',         ctrl.remover);
router.post('/:id/responder', ctrl.responder);

module.exports = router;
