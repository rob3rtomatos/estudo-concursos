/**
 * questoesController.js
 * CRUD completo de questões — isolado por usuario_id
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/questoes — Lista com filtros opcionais */
async function listar(req, res) {
  const { banca, materia_id, dificuldade, busca, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let sql = `
      SELECT q.id, q.banca, q.ano, q.enunciado, q.gabarito,
             q.dificuldade, q.comentario, q.criado_em, q.atualizado_em,
             q.alternativa_a, q.alternativa_b, q.alternativa_c,
             q.alternativa_d, q.alternativa_e,
             m.nome AS materia_nome, m.cor AS materia_cor, m.id AS materia_id
      FROM questoes q
      LEFT JOIN materias m ON m.id = q.materia_id
      WHERE q.usuario_id = $1
    `;
    const params = [req.usuario.id];
    let i = 2;

    if (banca)       { sql += ` AND q.banca = $${i++}`;                       params.push(banca); }
    if (materia_id)  { sql += ` AND q.materia_id = $${i++}`;                  params.push(materia_id); }
    if (dificuldade) { sql += ` AND q.dificuldade = $${i++}`;                 params.push(dificuldade); }
    if (busca)       { sql += ` AND q.enunciado ILIKE $${i++}`;               params.push(`%${busca}%`); }

    // Total para paginação
    const { rows: total } = await query(
      `SELECT COUNT(*) FROM (${sql}) t`, params
    );

    sql += ` ORDER BY q.criado_em DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), offset);

    const { rows } = await query(sql, params);
    return res.json({
      questoes: rows,
      total: parseInt(total[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(total[0].count) / parseInt(limit))
    });
  } catch (err) {
    logger.error('Erro ao listar questões:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar questões' });
  }
}

/** GET /api/questoes/:id */
async function buscarUm(req, res) {
  try {
    const { rows } = await query(
      `SELECT q.*, m.nome AS materia_nome, m.cor AS materia_cor
       FROM questoes q
       LEFT JOIN materias m ON m.id = q.materia_id
       WHERE q.id = $1 AND q.usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Questão não encontrada' });
    return res.json({ questao: rows[0] });
  } catch (err) {
    logger.error('Erro ao buscar questão:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar questão' });
  }
}

/** POST /api/questoes */
async function criar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const {
    materia_id, banca, ano, enunciado,
    alternativa_a, alternativa_b, alternativa_c,
    alternativa_d, alternativa_e,
    gabarito, comentario, dificuldade
  } = req.body;

  try {
    const { rows } = await query(
      `INSERT INTO questoes
         (usuario_id, materia_id, banca, ano, enunciado,
          alternativa_a, alternativa_b, alternativa_c,
          alternativa_d, alternativa_e,
          gabarito, comentario, dificuldade)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.usuario.id, materia_id || null,
        banca || null, ano || null, enunciado,
        alternativa_a || null, alternativa_b || null,
        alternativa_c || null, alternativa_d || null,
        alternativa_e || null,
        gabarito ? gabarito.toUpperCase() : null,
        comentario || null,
        dificuldade || 'media'
      ]
    );
    logger.info(`Questão criada ID ${rows[0].id} por usuário ${req.usuario.id}`);
    return res.status(201).json({ questao: rows[0] });
  } catch (err) {
    logger.error('Erro ao criar questão:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar questão' });
  }
}

/** PUT /api/questoes/:id */
async function atualizar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const {
    materia_id, banca, ano, enunciado,
    alternativa_a, alternativa_b, alternativa_c,
    alternativa_d, alternativa_e,
    gabarito, comentario, dificuldade
  } = req.body;

  try {
    const { rows } = await query(
      `UPDATE questoes SET
         materia_id    = $1,  banca         = $2,
         ano           = $3,  enunciado     = $4,
         alternativa_a = $5,  alternativa_b = $6,
         alternativa_c = $7,  alternativa_d = $8,
         alternativa_e = $9,  gabarito      = $10,
         comentario    = $11, dificuldade   = $12
       WHERE id = $13 AND usuario_id = $14
       RETURNING *`,
      [
        materia_id || null, banca || null,
        ano || null, enunciado,
        alternativa_a || null, alternativa_b || null,
        alternativa_c || null, alternativa_d || null,
        alternativa_e || null,
        gabarito ? gabarito.toUpperCase() : null,
        comentario || null, dificuldade || 'media',
        req.params.id, req.usuario.id
      ]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Questão não encontrada' });
    return res.json({ questao: rows[0] });
  } catch (err) {
    logger.error('Erro ao atualizar questão:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar questão' });
  }
}

/** DELETE /api/questoes/:id — Cascade remove de simulado_questoes */
async function remover(req, res) {
  try {
    const { rowCount } = await query(
      `DELETE FROM questoes WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (rowCount === 0)
      return res.status(404).json({ erro: 'Questão não encontrada' });
    return res.json({ mensagem: 'Questão removida com sucesso' });
  } catch (err) {
    logger.error('Erro ao remover questão:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover questão' });
  }
}

/** GET /api/questoes/bancas — Lista bancas únicas do usuário */
async function listarBancas(req, res) {
  try {
    const { rows } = await query(
      `SELECT DISTINCT banca FROM questoes
       WHERE usuario_id = $1 AND banca IS NOT NULL
       ORDER BY banca`,
      [req.usuario.id]
    );
    return res.json({ bancas: rows.map(r => r.banca) });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar bancas' });
  }
}

module.exports = { listar, buscarUm, criar, atualizar, remover, listarBancas };
