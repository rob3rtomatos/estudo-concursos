/**
 * cicloController.js
 * CRUD do ciclo semanal — sempre filtrado por usuario_id
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/ciclos — Retorna ciclo completo agrupado por dia */
async function listar(req, res) {
  try {
    const { rows } = await query(
      `SELECT c.id, c.dia_semana, c.horas_planejadas, c.ordem,
              m.id   AS materia_id,
              m.nome AS materia_nome,
              m.cor
       FROM ciclo_estudo c
       JOIN materias m ON m.id = c.materia_id
       WHERE c.usuario_id = $1
       ORDER BY c.dia_semana, c.ordem, m.nome`,
      [req.usuario.id]
    );

    // Agrupar por dia 0-6
    const porDia = {};
    for (let d = 0; d <= 6; d++) porDia[d] = [];
    rows.forEach(r => {
      porDia[r.dia_semana].push({
        id:              r.id,
        materiaId:       r.materia_id,
        materiaNome:     r.materia_nome,
        cor:             r.cor,
        horasPlanejadas: parseFloat(r.horas_planejadas),
        ordem:           r.ordem
      });
    });

    return res.json({ ciclo: porDia });
  } catch (err) {
    logger.error('Erro ao listar ciclo:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar ciclo' });
  }
}

/** GET /api/ciclos/resumo-semana — Total planejado x estudado da semana atual */
async function resumoSemana(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         COALESCE(SUM(c.horas_planejadas), 0)::float AS planejado,
         COALESCE(SUM(r.horas_estudadas),  0)::float AS estudado
       FROM ciclo_estudo c
       LEFT JOIN registro_estudo r
         ON  r.materia_id  = c.materia_id
         AND r.usuario_id  = c.usuario_id
         AND r.data_estudo >= DATE_TRUNC('week', CURRENT_DATE)
         AND r.data_estudo <  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
       WHERE c.usuario_id = $1`,
      [req.usuario.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    logger.error('Erro no resumo da semana:', err.message);
    return res.status(500).json({ erro: 'Erro ao calcular resumo' });
  }
}

/** POST /api/ciclos — Adiciona entrada ao ciclo */
async function criar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ erros: errors.array() });

  const { dia_semana, materia_id, horas_planejadas, ordem } = req.body;
  try {
    // Verificar se matéria pertence ao usuário autenticado
    const { rows: mat } = await query(
      `SELECT id FROM materias WHERE id = $1 AND usuario_id = $2`,
      [materia_id, req.usuario.id]
    );
    if (mat.length === 0)
      return res.status(404).json({ erro: 'Matéria não encontrada' });

    const { rows } = await query(
      `INSERT INTO ciclo_estudo
         (usuario_id, materia_id, dia_semana, horas_planejadas, ordem)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, materia_id, dia_semana)
       DO UPDATE SET
         horas_planejadas = EXCLUDED.horas_planejadas,
         ordem            = EXCLUDED.ordem
       RETURNING *`,
      [req.usuario.id, materia_id, dia_semana, horas_planejadas, ordem || 0]
    );
    return res.status(201).json({ entrada: rows[0] });
  } catch (err) {
    logger.error('Erro ao criar ciclo:', err.message);
    return res.status(500).json({ erro: 'Erro ao salvar ciclo' });
  }
}

/** DELETE /api/ciclos/:id — Remove entrada (somente do próprio usuário) */
async function remover(req, res) {
  try {
    const { rowCount } = await query(
      `DELETE FROM ciclo_estudo WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (rowCount === 0)
      return res.status(404).json({ erro: 'Entrada não encontrada' });
    return res.json({ mensagem: 'Entrada removida' });
  } catch (err) {
    logger.error('Erro ao remover ciclo:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover' });
  }
}

module.exports = { listar, criar, remover, resumoSemana };
