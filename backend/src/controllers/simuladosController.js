/**
 * simuladosController.js
 * CRUD de simulados + vínculo com questões + aplicação e correção
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/simulados */
async function listar(req, res) {
  try {
    const { rows } = await query(
      `SELECT s.*,
         COUNT(DISTINCT sq.questao_id)::int AS total_questoes
       FROM simulados s
       LEFT JOIN simulado_questoes sq ON sq.simulado_id = s.id
       WHERE s.usuario_id = $1
       GROUP BY s.id
       ORDER BY s.criado_em DESC`,
      [req.usuario.id]
    );
    return res.json({ simulados: rows });
  } catch (err) {
    logger.error('Erro ao listar simulados:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar simulados' });
  }
}

/** GET /api/simulados/:id — Simulado com questões completas */
async function buscarUm(req, res) {
  try {
    const { rows: sim } = await query(
      `SELECT * FROM simulados WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (sim.length === 0)
      return res.status(404).json({ erro: 'Simulado não encontrado' });

    const { rows: questoes } = await query(
      `SELECT q.id, q.banca, q.ano, q.enunciado,
              q.alternativa_a, q.alternativa_b, q.alternativa_c,
              q.alternativa_d, q.alternativa_e,
              q.gabarito, q.comentario, q.dificuldade,
              m.nome AS materia_nome, m.cor AS materia_cor,
              sq.ordem
       FROM simulado_questoes sq
       JOIN questoes q ON q.id = sq.questao_id
       LEFT JOIN materias m ON m.id = q.materia_id
       WHERE sq.simulado_id = $1
       ORDER BY sq.ordem, q.id`,
      [req.params.id]
    );

    return res.json({ simulado: { ...sim[0], questoes } });
  } catch (err) {
    logger.error('Erro ao buscar simulado:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar simulado' });
  }
}

/** POST /api/simulados */
async function criar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const { titulo, descricao, tempo_min, questao_ids } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO simulados (usuario_id, titulo, descricao, tempo_min)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.usuario.id, titulo, descricao || null, tempo_min || 60]
    );
    const simulado = rows[0];

    // Vincular questões se enviadas
    if (questao_ids && questao_ids.length > 0) {
      for (let i = 0; i < questao_ids.length; i++) {
        await query(
          `INSERT INTO simulado_questoes (simulado_id, questao_id, ordem)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [simulado.id, questao_ids[i], i]
        );
      }
    }

    logger.info(`Simulado criado ID ${simulado.id} por usuário ${req.usuario.id}`);
    return res.status(201).json({ simulado: { ...simulado, total_questoes: questao_ids?.length || 0 } });
  } catch (err) {
    logger.error('Erro ao criar simulado:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar simulado' });
  }
}

/** PUT /api/simulados/:id */
async function atualizar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const { titulo, descricao, tempo_min, questao_ids } = req.body;
  try {
    const { rows } = await query(
      `UPDATE simulados SET titulo=$1, descricao=$2, tempo_min=$3
       WHERE id=$4 AND usuario_id=$5 RETURNING *`,
      [titulo, descricao || null, tempo_min || 60, req.params.id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Simulado não encontrado' });

    // Recriar vínculos de questões
    if (questao_ids !== undefined) {
      await query(`DELETE FROM simulado_questoes WHERE simulado_id = $1`, [req.params.id]);
      for (let i = 0; i < questao_ids.length; i++) {
        await query(
          `INSERT INTO simulado_questoes (simulado_id, questao_id, ordem)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [req.params.id, questao_ids[i], i]
        );
      }
    }

    return res.json({ simulado: rows[0] });
  } catch (err) {
    logger.error('Erro ao atualizar simulado:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar simulado' });
  }
}

/** DELETE /api/simulados/:id */
async function remover(req, res) {
  try {
    const { rowCount } = await query(
      `DELETE FROM simulados WHERE id=$1 AND usuario_id=$2`,
      [req.params.id, req.usuario.id]
    );
    if (rowCount === 0)
      return res.status(404).json({ erro: 'Simulado não encontrado' });
    return res.json({ mensagem: 'Simulado removido com sucesso' });
  } catch (err) {
    logger.error('Erro ao remover simulado:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover simulado' });
  }
}

/**
 * POST /api/simulados/:id/responder
 * Salva respostas do aluno e retorna resultado
 */
async function responder(req, res) {
  const { respostas, tentativa } = req.body;
  // respostas: [{ questao_id, resposta }]
  try {
    const { rows: sim } = await query(
      `SELECT id FROM simulados WHERE id=$1 AND usuario_id=$2`,
      [req.params.id, req.usuario.id]
    );
    if (sim.length === 0)
      return res.status(404).json({ erro: 'Simulado não encontrado' });

    let acertos = 0;
    const detalhes = [];

    for (const r of respostas) {
      const { rows: q } = await query(
        `SELECT gabarito FROM questoes WHERE id=$1 AND usuario_id=$2`,
        [r.questao_id, req.usuario.id]
      );
      const correta = q[0]?.gabarito === r.resposta?.toUpperCase();
      if (correta) acertos++;

      await query(
        `INSERT INTO simulado_respostas
           (simulado_id, questao_id, usuario_id, resposta, correta, tentativa)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, r.questao_id, req.usuario.id,
         r.resposta?.toUpperCase() || null, correta, tentativa || 1]
      );
      detalhes.push({ questao_id: r.questao_id, correta, gabarito: q[0]?.gabarito });
    }

    return res.json({
      acertos,
      total:       respostas.length,
      percentual:  respostas.length > 0 ? Math.round((acertos / respostas.length) * 100) : 0,
      detalhes
    });
  } catch (err) {
    logger.error('Erro ao responder simulado:', err.message);
    return res.status(500).json({ erro: 'Erro ao salvar respostas' });
  }
}

module.exports = { listar, buscarUm, criar, atualizar, remover, responder };
