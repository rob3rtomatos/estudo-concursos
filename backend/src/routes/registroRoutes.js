const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/registroController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();
router.use(autenticar);

router.get('/hoje',   ctrl.hoje);
router.get('/',       ctrl.porPeriodo);
router.post('/',
  [
    body('materia_id').isInt({ gt: 0 }),
    body('data_estudo').isDate().withMessage('Data inválida'),
    body('horas_estudadas').isFloat({ min: 0 }).withMessage('Horas devem ser ≥ 0')
  ],
  ctrl.salvar
);

module.exports = router;
