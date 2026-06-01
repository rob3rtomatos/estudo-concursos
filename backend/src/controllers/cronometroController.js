/**
 * cronometroController.js
 * Gerencia sessões de estudo do cronômetro Pomodoro
 * Estados: ativo=TRUE pausado=FALSE → rodando
 *          ativo=TRUE pausado=TRUE  → pausado
 *          ativo=FALSE              → encerrado (histórico)
 */

const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/* ── GET /api/cronometro/ativa ── */
async function buscarAtiva(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         s.id, s.materia_id, s.iniciado_em, s.duracao_seg,
         s.ativo, s.pausado, s.pausado_em,
         m.nome AS materia_nome,
         m.cor  AS materia_cor,
         CASE
           WHEN s.pausado = TRUE THEN s.duracao_seg
           ELSE s.duracao_seg +
             EXTRACT(EPOCH FROM (NOW() - s.iniciado_em))::int -
             COALESCE(
               EXTRACT(EPOCH FROM (s.pausado_em - s.iniciado_em))::int, 0
             )
         END AS segundos_decorridos
       FROM sessoes_estudo s
       JOIN materias m ON m.id = s.materia_id
       WHERE s.usuario_id = $1 AND s.ativo = TRUE
       ORDER BY s.iniciado_em DESC
       LIMIT 1`,
      [req.usuario.id]
    );
    return res.json({ sessao: rows[0] || null });
  } catch (err) {
    logger.error('Erro ao buscar sessão ativa:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar cronômetro' });
  }
}

/* ── POST /api/cronometro/iniciar ── */
async function iniciar(req, res) {
  const { materia_id } = req.body;
  if (!materia_id)
    return res.status(422).json({ erro: 'materia_id é obrigatório' });

  try {
    const { rows: mat } = await query(
      `SELECT id, nome, cor FROM materias WHERE id = $1 AND usuario_id = $2`,
      [materia_id, req.usuario.id]
    );
    if (mat.length === 0)
      return res.status(404).json({ erro: 'Matéria não encontrada' });

    // Encerrar qualquer sessão ativa anterior
    await query(
      `UPDATE sessoes_estudo
       SET ativo = FALSE, encerrado_em = NOW(),
           duracao_seg = CASE
             WHEN pausado = TRUE THEN duracao_seg
             ELSE GREATEST(duracao_seg,
               EXTRACT(EPOCH FROM (NOW() - iniciado_em))::int)
           END
       WHERE usuario_id = $1 AND ativo = TRUE`,
      [req.usuario.id]
    );

    const { rows } = await query(
      `INSERT INTO sessoes_estudo (usuario_id, materia_id, pausado)
       VALUES ($1, $2, FALSE)
       RETURNING id, materia_id, iniciado_em, duracao_seg, ativo, pausado`,
      [req.usuario.id, materia_id]
    );

    logger.info(`Cronômetro iniciado: usuário ${req.usuario.id}, matéria ${mat[0].nome}`);
    return res.status(201).json({
      sessao: { ...rows[0], materia_nome: mat[0].nome,
        materia_cor: mat[0].cor, segundos_decorridos: 0 }
    });
  } catch (err) {
    logger.error('Erro ao iniciar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao iniciar cronômetro' });
  }
}

/* ── PATCH /api/cronometro/pausar ── (sync periódico do frontend) */
async function pausar(req, res) {
  const { duracao_seg } = req.body;
  try {
    const { rows } = await query(
      `UPDATE sessoes_estudo SET duracao_seg = $1
       WHERE usuario_id = $2 AND ativo = TRUE AND pausado = FALSE
       RETURNING id, duracao_seg`,
      [duracao_seg || 0, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Nenhuma sessão ativa em andamento' });
    return res.json({ sessao: rows[0] });
  } catch (err) {
    logger.error('Erro ao sincronizar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao sincronizar cronômetro' });
  }
}

/* ── PATCH /api/cronometro/pausar-timer ── (pausa visual do timer) */
async function pausarTimer(req, res) {
  const { duracao_seg } = req.body;
  try {
    const { rows } = await query(
      `UPDATE sessoes_estudo
       SET pausado = TRUE, pausado_em = NOW(),
           duracao_seg = $1
       WHERE usuario_id = $2 AND ativo = TRUE AND pausado = FALSE
       RETURNING id, duracao_seg, pausado, pausado_em`,
      [duracao_seg || 0, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Nenhuma sessão ativa para pausar' });
    logger.info(`Timer pausado: usuário ${req.usuario.id}, ${duracao_seg}s acumulados`);
    return res.json({ sessao: rows[0] });
  } catch (err) {
    logger.error('Erro ao pausar timer:', err.message);
    return res.status(500).json({ erro: 'Erro ao pausar timer' });
  }
}

/* ── PATCH /api/cronometro/retomar ── */
async function retomarTimer(req, res) {
  try {
    const { rows } = await query(
      `UPDATE sessoes_estudo
       SET pausado = FALSE, pausado_em = NULL,
           -- Resetar iniciado_em para NOW() para cálculo correto do delta
           iniciado_em = NOW()
       WHERE usuario_id = $1 AND ativo = TRUE AND pausado = TRUE
       RETURNING id, duracao_seg, pausado, iniciado_em`,
      [req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Nenhuma sessão pausada para retomar' });
    logger.info(`Timer retomado: usuário ${req.usuario.id}`);
    return res.json({ sessao: rows[0] });
  } catch (err) {
    logger.error('Erro ao retomar timer:', err.message);
    return res.status(500).json({ erro: 'Erro ao retomar timer' });
  }
}

/* ── PATCH /api/cronometro/encerrar ── */
async function encerrar(req, res) {
  try {
    const { rows } = await query(
      `UPDATE sessoes_estudo
       SET ativo = FALSE, encerrado_em = NOW(),
           duracao_seg = CASE
             WHEN pausado = TRUE THEN duracao_seg
             ELSE GREATEST(duracao_seg,
               EXTRACT(EPOCH FROM (NOW() - iniciado_em))::int)
           END,
           pausado = FALSE
       WHERE usuario_id = $1 AND ativo = TRUE
       RETURNING id, materia_id, iniciado_em, encerrado_em, duracao_seg`,
      [req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Nenhuma sessão ativa para encerrar' });

    const sessao  = rows[0];
    const minutos = sessao.duracao_seg / 60;
    const horas   = parseFloat((minutos / 60).toFixed(2));

    if (minutos >= 1) {
      const dataEstudo = new Date(sessao.iniciado_em).toISOString().slice(0, 10);
      await query(
        `INSERT INTO registro_estudo
           (usuario_id, materia_id, data_estudo, horas_estudadas, observacoes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (usuario_id, materia_id, data_estudo)
         DO UPDATE SET
           horas_estudadas = registro_estudo.horas_estudadas + EXCLUDED.horas_estudadas`,
        [req.usuario.id, sessao.materia_id, dataEstudo,
         Math.max(0.1, parseFloat(horas.toFixed(1))),
         `Sessão do cronômetro: ${Math.round(minutos)} min`]
      );
    }

    logger.info(`Cronômetro encerrado: ${Math.round(minutos)} minutos`);
    return res.json({ sessao, duracao_min: Math.round(minutos), auto_registrado: minutos >= 1 });
  } catch (err) {
    logger.error('Erro ao encerrar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao encerrar cronômetro' });
  }
}

/* ── GET /api/cronometro/historico ── */
async function historico(req, res) {
  try {
    const { rows } = await query(
      `SELECT s.id, s.iniciado_em, s.encerrado_em, s.duracao_seg,
              m.nome AS materia_nome, m.cor AS materia_cor
       FROM sessoes_estudo s
       JOIN materias m ON m.id = s.materia_id
       WHERE s.usuario_id = $1 AND s.ativo = FALSE
       ORDER BY s.iniciado_em DESC
       LIMIT 30`,
      [req.usuario.id]
    );
    return res.json({ historico: rows });
  } catch (err) {
    logger.error('Erro ao buscar histórico:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
}

/* ── DELETE /api/cronometro/:id ── */
async function removerSessao(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `DELETE FROM sessoes_estudo
       WHERE id = $1 AND usuario_id = $2 AND ativo = FALSE
       RETURNING id`,
      [id, req.usuario.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Sessão não encontrada' });
    return res.json({ ok: true });
  } catch (err) {
    logger.error('Erro ao remover sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao remover sessão' });
  }
}

module.exports = {
  buscarAtiva, iniciar, pausar, pausarTimer, retomarTimer,
  encerrar, historico, removerSessao
};
