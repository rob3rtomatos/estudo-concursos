/**
 * materiasController.js
 * CRUD completo de matérias — sempre filtrado por usuario_id (JWT)
 * Garante isolamento: cada usuário vê APENAS suas próprias matérias
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/materias — Lista matérias do usuário autenticado */
async function listar(req, res) {
  try {
    const { rows } = await query(
      `SELECT id, nome, cor, criado_em
       FROM materias
       WHERE usuario_id = $1
       ORDER BY nome ASC`,
      [req.usuario.id]
    );
    return res.json({ materias: rows });
  } catch (err) {
    logger.error('Erro ao listar matérias:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar matérias' });
  }
}

/** GET /api/materias/:id — Busca uma matéria (somente do próprio usuário) */
async function buscarUm(req, res) {
  try {
    const { rows } = await query(
      `SELECT id, nome, cor, criado_em
       FROM materias
       WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Matéria não encontrada' });
    return res.json({ materia: rows[0] });
  } catch (err) {
    logger.error('Erro ao buscar matéria:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar matéria' });
  }
}

/** POST /api/materias — Cria nova matéria vinculada ao usuário */
async function criar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ erros: errors.array() });

  const { nome, cor } = req.body;
  try {
    // Impedir duplicata de nome para o mesmo usuário
    const { rows: dup } = await query(
      `SELECT id FROM materias WHERE usuario_id = $1 AND LOWER(nome) = LOWER($2)`,
      [req.usuario.id, nome]
    );
    if (dup.length > 0)
      return res.status(409).json({ erro: 'Você já possui uma matéria com este nome' });

    const { rows } = await query(
      `INSERT INTO materias (usuario_id, nome, cor)
       VALUES ($1, $2, $3)
       RETURNING id, nome, cor, criado_em`,
      [req.usuario.id, nome.trim(), cor || '#6366f1']
    );
    logger.info(`Matéria criada: "${nome}" para usuário ${req.usuario.id}`);
    return res.status(201).json({ materia: rows[0] });
  } catch (err) {
    logger.error('Erro ao criar matéria:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar matéria' });
  }
}

/** PUT /api/materias/:id — Atualiza nome/cor (somente do próprio usuário) */
async function atualizar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ erros: errors.array() });

  const { nome, cor } = req.body;
  const { id }        = req.params;
  try {
    const { rows } = await query(
      `UPDATE materias
       SET nome = COALESCE($1, nome),
           cor  = COALESCE($2, cor)
       WHERE id = $3 AND usuario_id = $4
       RETURNING id, nome, cor`,
      [nome?.trim(), cor, id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Matéria não encontrada' });
    return res.json({ materia: rows[0] });
  } catch (err) {
    logger.error('Erro ao atualizar matéria:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar matéria' });
  }
}

/**
 * DELETE /api/materias/:id
 * Remove matéria e em cascata: ciclo_estudo + registro_estudo vinculados
 * (cascade definido no banco via ON DELETE CASCADE)
 */
async function remover(req, res) {
  const { id } = req.params;
  try {
    // Verificar se pertence ao usuário antes de deletar
    const { rows: check } = await query(
      `SELECT id FROM materias WHERE id = $1 AND usuario_id = $2`,
      [id, req.usuario.id]
    );
    if (check.length === 0)
      return res.status(404).json({ erro: 'Matéria não encontrada' });

    await query(
      `DELETE FROM materias WHERE id = $1 AND usuario_id = $2`,
      [id, req.usuario.id]
    );
    logger.info(`Matéria ID ${id} removida pelo usuário ${req.usuario.id}`);
    return res.json({ mensagem: 'Matéria removida com sucesso' });
  } catch (err) {
    logger.error('Erro ao remover matéria:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover matéria' });
  }
}

module.exports = { listar, buscarUm, criar, atualizar, remover };
