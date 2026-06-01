/**
 * authMiddleware.js - Middleware de autenticação JWT
 * Verifica o token Bearer em todas as rotas protegidas
 */

const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware que valida o JWT no header Authorization
 * Injeta req.usuario = { id, email } para uso nos controllers
 */
function autenticar(req, res, next) {
  try {
    // Extrair token do header: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token de acesso não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar e decodificar o token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Injetar dados do usuário na requisição
    req.usuario = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    logger.warn('Token JWT inválido:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

module.exports = { autenticar };
