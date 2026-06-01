const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/materiasController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);  // Todas as rotas exigem JWT válido

const validarMateria = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ max: 100 }).withMessage('Nome muito longo (máx 100 caracteres)')
];

router.get('/',       ctrl.listar);
router.get('/:id',    ctrl.buscarUm);
router.post('/',      validarMateria, ctrl.criar);
router.put('/:id',    validarMateria, ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
