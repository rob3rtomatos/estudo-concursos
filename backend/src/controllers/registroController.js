/**
 * registroController.js - Salvar e consultar horas estudadas
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** POST /api/registros - Salvar ou atualizar horas estudadas no dia */
async function salvar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const { materia_id, data_estudo, horas_estudadas, observacoes } = req.body;

  try {
    // Verificar se matéria pertence ao usuário
    const { rows: mat } = await query(
      'SELECT id FROM materias WHERE id = $1 AND usuario_id = $2',
      [materia_id, req.usuario.id]
    );
    if (mat.length === 0) {
      return res.status(404).json({ erro: 'Matéria não encontrada' });
    }

    // Upsert: inserir ou atualizar se já existe registro para o mesmo dia/matéria
    const { rows } = await query(
      `INSERT INTO registro_estudo
         (usuario_id, materia_id, data_estudo, horas_estudadas, observacoes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, materia_id, data_estudo)
       DO UPDATE SET
         horas_estudadas = EXCLUDED.horas_estudadas,
         observacoes     = EXCLUDED.observacoes
       RETURNING *`,
      [req.usuario.id, materia_id, data_estudo, horas_estudadas, observacoes || null]
    );
    return res.status(201).json({ registro: rows[0] });
  } catch (err) {
    logger.error('Erro ao salvar registro:', err.message);
    return res.status(500).json({ erro: 'Erro ao salvar registro' });
  }
}

/** GET /api/registros/hoje - Registros de hoje do usuário */
async function hoje(req, res) {
  try {
    const { rows } = await query(
      `SELECT r.id, r.data_estudo, r.horas_estudadas, r.observacoes,
              m.nome AS materia_nome, m.cor
       FROM registro_estudo r
       JOIN materias m ON m.id = r.materia_id
       WHERE r.usuario_id = $1 AND r.data_estudo = CURRENT_DATE
       ORDER BY m.nome`,
      [req.usuario.id]
    );
    return res.json({ registros: rows });
  } catch (err) {
    logger.error('Erro ao buscar registros de hoje:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
}

/** GET /api/registros?inicio=YYYY-MM-DD&fim=YYYY-MM-DD - Registros por período */
async function porPeriodo(req, res) {
  const { inicio, fim } = req.query;
  const dataInicio = inicio || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dataFim    = fim    || new Date().toISOString().slice(0, 10);

  try {
    const { rows } = await query(
      `SELECT r.id, r.data_estudo, r.horas_estudadas, r.observacoes,
              m.id AS materia_id, m.nome AS materia_nome, m.cor
       FROM registro_estudo r
       JOIN materias m ON m.id = r.materia_id
       WHERE r.usuario_id = $1
         AND r.data_estudo BETWEEN $2 AND $3
       ORDER BY r.data_estudo DESC, m.nome`,
      [req.usuario.id, dataInicio, dataFim]
    );
    return res.json({ registros: rows });
  } catch (err) {
    logger.error('Erro ao buscar registros:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
}

module.exports = { salvar, hoje, porPeriodo };
