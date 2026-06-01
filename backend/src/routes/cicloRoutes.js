const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/cicloController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

router.get('/',              ctrl.listar);
router.get('/resumo-semana', ctrl.resumoSemana);
router.post('/',
  [
    body('dia_semana').isInt({ min: 0, max: 6 }).withMessage('Dia inválido'),
    body('materia_id').isInt({ gt: 0 }).withMessage('Matéria inválida'),
    body('horas_planejadas').isFloat({ gt: 0 }).withMessage('Horas devem ser > 0')
  ],
  ctrl.criar
);
router.delete('/:id', ctrl.remover);

module.exports = router;
