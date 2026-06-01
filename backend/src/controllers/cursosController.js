/**
 * cursosController.js
 * CRUD completo de cursos — isolado por usuario_id
 * Vinculado a matérias (N:N) e monitoramento do ciclo
 */

const { validationResult } = require('express-validator');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/cursos */
async function listar(req, res) {
  try {
    const { rows } = await query(
      `SELECT c.*,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT('id', m.id, 'nome', m.nome, 'cor', m.cor)
             ORDER BY m.nome
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'
         ) AS materias
       FROM cursos c
       LEFT JOIN curso_materias cm ON cm.curso_id = c.id
       LEFT JOIN materias m ON m.id = cm.materia_id
       WHERE c.usuario_id = $1
       GROUP BY c.id
       ORDER BY c.criado_em DESC`,
      [req.usuario.id]
    );
    return res.json({ cursos: rows });
  } catch (err) {
    logger.error('Erro ao listar cursos:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar cursos' });
  }
}

/** GET /api/cursos/:id */
async function buscarUm(req, res) {
  try {
    const { rows } = await query(
      `SELECT c.*,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT('id', m.id, 'nome', m.nome, 'cor', m.cor)
             ORDER BY m.nome
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'
         ) AS materias
       FROM cursos c
       LEFT JOIN curso_materias cm ON cm.curso_id = c.id
       LEFT JOIN materias m ON m.id = cm.materia_id
       WHERE c.id = $1 AND c.usuario_id = $2
       GROUP BY c.id`,
      [req.params.id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Curso não encontrado' });
    return res.json({ curso: rows[0] });
  } catch (err) {
    logger.error('Erro ao buscar curso:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar curso' });
  }
}

/** POST /api/cursos */
async function criar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const { nome, descricao, plataforma, carga_horaria,
          progresso, status, cor, materia_ids } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO cursos
         (usuario_id, nome, descricao, plataforma,
          carga_horaria, progresso, status, cor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.usuario.id, nome.trim(), descricao || null,
       plataforma || null, carga_horaria || 0,
       progresso || 0, status || 'em_andamento', cor || '#6366f1']
    );
    const curso = rows[0];

    // Vincular matérias
    if (materia_ids?.length) {
      for (const mid of materia_ids) {
        await query(
          `INSERT INTO curso_materias (curso_id, materia_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [curso.id, mid]
        );
      }
    }

    logger.info(`Curso criado ID ${curso.id} por usuário ${req.usuario.id}`);
    return res.status(201).json({ curso: { ...curso, materias: [] } });
  } catch (err) {
    logger.error('Erro ao criar curso:', err.message);
    return res.status(500).json({ erro: 'Erro ao criar curso' });
  }
}

/** PUT /api/cursos/:id */
async function atualizar(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ erros: errors.array() });

  const { nome, descricao, plataforma, carga_horaria,
          progresso, status, cor, materia_ids } = req.body;
  try {
    const { rows } = await query(
      `UPDATE cursos SET
         nome          = $1, descricao    = $2,
         plataforma    = $3, carga_horaria = $4,
         progresso     = $5, status        = $6,
         cor           = $7
       WHERE id = $8 AND usuario_id = $9
       RETURNING *`,
      [nome.trim(), descricao || null, plataforma || null,
       carga_horaria || 0, progresso || 0,
       status || 'em_andamento', cor || '#6366f1',
       req.params.id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Curso não encontrado' });

    // Recriar vínculos de matérias
    await query(`DELETE FROM curso_materias WHERE curso_id = $1`, [req.params.id]);
    if (materia_ids?.length) {
      for (const mid of materia_ids) {
        await query(
          `INSERT INTO curso_materias (curso_id, materia_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [req.params.id, mid]
        );
      }
    }

    return res.json({ curso: rows[0] });
  } catch (err) {
    logger.error('Erro ao atualizar curso:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar curso' });
  }
}

/** DELETE /api/cursos/:id */
async function remover(req, res) {
  try {
    const { rowCount } = await query(
      `DELETE FROM cursos WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (rowCount === 0)
      return res.status(404).json({ erro: 'Curso não encontrado' });
    return res.json({ mensagem: 'Curso removido com sucesso' });
  } catch (err) {
    logger.error('Erro ao remover curso:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover curso' });
  }
}

/** GET /api/cursos/resumo — Para o dashboard e monitoramento */
async function resumo(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         COUNT(*)::int                                        AS total,
         COUNT(*) FILTER (WHERE status='concluido')::int     AS concluidos,
         COUNT(*) FILTER (WHERE status='em_andamento')::int  AS em_andamento,
         COUNT(*) FILTER (WHERE status='nao_iniciado')::int  AS nao_iniciados,
         COALESCE(SUM(carga_horaria), 0)::int                AS carga_total,
         ROUND(AVG(progresso)::numeric, 1)                   AS progresso_medio
       FROM cursos WHERE usuario_id = $1`,
      [req.usuario.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    logger.error('Erro no resumo de cursos:', err.message);
    return res.status(500).json({ erro: 'Erro ao calcular resumo' });
  }
}

module.exports = { listar, buscarUm, criar, atualizar, remover, resumo };
