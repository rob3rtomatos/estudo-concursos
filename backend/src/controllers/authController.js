/**
 * authController.js - Controla registro, login e refresh de token
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/**
 * Gera um access token JWT (curto prazo)
 * @param {{ id: number, email: string }} usuario
 * @returns {string}
 */
function gerarAccessToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/registro
 * Cria novo usuário com senha criptografada
 */
async function registro(req, res) {
  // Validar campos obrigatórios
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ erros: errors.array() });
  }

  const { nome, email, senha } = req.body;

  try {
    // Verificar se o email já existe
    const { rows: existe } = await query(
      'SELECT id FROM usuarios WHERE email = $1', [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    // Criptografar senha com bcrypt (custo 10)
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário no banco
    const { rows } = await query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );

    const novoUsuario = rows[0];
    const token = gerarAccessToken(novoUsuario);

    logger.info(`Novo usuário registrado: ${email}`);
    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso',
      token,
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });
  } catch (err) {
    logger.error('Erro no registro:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
}

/**
 * POST /api/auth/login
 * Autentica usuário e retorna JWT
 */
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ erros: errors.array() });
  }

  const { email, senha } = req.body;

  try {
    // Buscar usuário pelo email
    const { rows } = await query(
      'SELECT id, nome, email, senha_hash, ativo FROM usuarios WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const usuario = rows[0];

    // Verificar se conta está ativa
    if (!usuario.ativo) {
      return res.status(403).json({ erro: 'Conta desativada' });
    }

    // Comparar senha com hash armazenado
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = gerarAccessToken(usuario);

    logger.info(`Login bem-sucedido: ${email}`);
    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (err) {
    logger.error('Erro no login:', err.message);
    return res.status(500).json({ erro: 'Erro ao realizar login' });
  }
}

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado (valida token)
 */
async function me(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    return res.json({ usuario: rows[0] });
  } catch (err) {
    logger.error('Erro em /me:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
}

module.exports = { registro, login, me };
