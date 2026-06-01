const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/questoesController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

const validar = [
  body('enunciado').trim().notEmpty().withMessage('Enunciado é obrigatório')
];

router.get('/bancas', ctrl.listarBancas);
router.get('/',       ctrl.listar);
router.get('/:id',    ctrl.buscarUm);
router.post('/',      validar, ctrl.criar);
router.put('/:id',    validar, ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
