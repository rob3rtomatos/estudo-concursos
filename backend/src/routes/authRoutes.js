const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('../controllers/authController');
const { autenticar } = require('../middleware/authMiddleware');

const router = Router();

// Validações de registro
const validarRegistro = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

// Validações de login
const validarLogin = [
  body('email').isEmail().normalizeEmail(),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
];

router.post('/registro', validarRegistro, ctrl.registro);
router.post('/login',    validarLogin,    ctrl.login);
router.get('/me',        autenticar,      ctrl.me);

module.exports = router;
