const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/cursosController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

const validar = [
  body('nome').trim().notEmpty().withMessage('Nome do curso é obrigatório')
    .isLength({ max: 200 }).withMessage('Nome muito longo')
];

router.get('/resumo', ctrl.resumo);
router.get('/',       ctrl.listar);
router.get('/:id',    ctrl.buscarUm);
router.post('/',      validar, ctrl.criar);
router.put('/:id',    validar, ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
