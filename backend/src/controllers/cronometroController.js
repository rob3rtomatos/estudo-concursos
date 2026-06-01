/**
 * cronometroController.js
 * Gerencia sessões de estudo do cronômetro Pomodoro
 * Cada usuário pode ter apenas UMA sessão ativa por vez
 */

const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/**
 * GET /api/cronometro/ativa
 * Retorna sessão ativa do usuário (se houver) + segundos decorridos
 * O frontend usa para restaurar o cronômetro ao navegar entre páginas
 */
async function buscarAtiva(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         s.id,
         s.materia_id,
         s.iniciado_em,
         s.duracao_seg,
         s.ativo,
         m.nome AS materia_nome,
         m.cor  AS materia_cor,
         -- Calcular segundos já decorridos desde o início
         EXTRACT(EPOCH FROM (NOW() - s.iniciado_em))::int AS segundos_decorridos
       FROM sessoes_estudo s
       JOIN materias m ON m.id = s.materia_id
       WHERE s.usuario_id = $1 AND s.ativo = TRUE
       ORDER BY s.iniciado_em DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.json({ sessao: null });
    }

    return res.json({ sessao: rows[0] });
  } catch (err) {
    logger.error('Erro ao buscar sessão ativa:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar cronômetro' });
  }
}

/**
 * POST /api/cronometro/iniciar
 * Inicia nova sessão de estudo para a matéria informada
 * Se já houver sessão ativa, encerra ela antes de criar nova
 */
async function iniciar(req, res) {
  const { materia_id } = req.body;

  if (!materia_id) {
    return res.status(422).json({ erro: 'materia_id é obrigatório' });
  }

  try {
    // Verificar se matéria pertence ao usuário
    const { rows: mat } = await query(
      `SELECT id, nome, cor FROM materias WHERE id = $1 AND usuario_id = $2`,
      [materia_id, req.usuario.id]
    );
    if (mat.length === 0) {
      return res.status(404).json({ erro: 'Matéria não encontrada' });
    }

    // Encerrar sessão ativa anterior se existir
    await query(
      `UPDATE sessoes_estudo
       SET ativo        = FALSE,
           encerrado_em = NOW(),
           duracao_seg  = EXTRACT(EPOCH FROM (NOW() - iniciado_em))::int
       WHERE usuario_id = $1 AND ativo = TRUE`,
      [req.usuario.id]
    );

    // Criar nova sessão
    const { rows } = await query(
      `INSERT INTO sessoes_estudo (usuario_id, materia_id)
       VALUES ($1, $2)
       RETURNING id, materia_id, iniciado_em, duracao_seg, ativo`,
      [req.usuario.id, materia_id]
    );

    logger.info(`Cronômetro iniciado: usuário ${req.usuario.id}, matéria ${mat[0].nome}`);

    return res.status(201).json({
      sessao: {
        ...rows[0],
        materia_nome: mat[0].nome,
        materia_cor:  mat[0].cor,
        segundos_decorridos: 0
      }
    });
  } catch (err) {
    logger.error('Erro ao iniciar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao iniciar cronômetro' });
  }
}

/**
 * PATCH /api/cronometro/pausar
 * Salva o progresso atual (segundos) sem encerrar a sessão
 * Usado pelo frontend a cada 30s para sincronizar com o banco
 */
async function pausar(req, res) {
  const { duracao_seg } = req.body;

  try {
    const { rows } = await query(
      `UPDATE sessoes_estudo
       SET duracao_seg = $1
       WHERE usuario_id = $2 AND ativo = TRUE
       RETURNING id, duracao_seg`,
      [duracao_seg || 0, req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma sessão ativa' });
    }

    return res.json({ sessao: rows[0] });
  } catch (err) {
    logger.error('Erro ao pausar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao pausar cronômetro' });
  }
}

/**
 * PATCH /api/cronometro/encerrar
 * Encerra a sessão ativa e retorna duração total
 * Salva automaticamente em registro_estudo se duração >= 1 minuto
 */
async function encerrar(req, res) {
  try {
    // Encerrar sessão e capturar dados
    const { rows } = await query(
      `UPDATE sessoes_estudo
       SET ativo        = FALSE,
           encerrado_em = NOW(),
           duracao_seg  = GREATEST(
             duracao_seg,
             EXTRACT(EPOCH FROM (NOW() - iniciado_em))::int
           )
       WHERE usuario_id = $1 AND ativo = TRUE
       RETURNING id, materia_id, iniciado_em, encerrado_em, duracao_seg`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma sessão ativa para encerrar' });
    }

    const sessao = rows[0];
    const minutos = sessao.duracao_seg / 60;
    const horas   = parseFloat((minutos / 60).toFixed(2));

    // Auto-registrar em registro_estudo se estudou >= 1 minuto
    if (minutos >= 1) {
      const dataEstudo = new Date(sessao.iniciado_em).toISOString().slice(0, 10);
      await query(
        `INSERT INTO registro_estudo
           (usuario_id, materia_id, data_estudo, horas_estudadas, observacoes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (usuario_id, materia_id, data_estudo)
         DO UPDATE SET
           horas_estudadas = registro_estudo.horas_estudadas + EXCLUDED.horas_estudadas`,
        [
          req.usuario.id,
          sessao.materia_id,
          dataEstudo,
          Math.max(0.1, parseFloat(horas.toFixed(1))),
          `Sessão do cronômetro: ${Math.round(minutos)} min`
        ]
      );
      logger.info(`Auto-registro: ${horas}h para usuário ${req.usuario.id}`);
    }

    logger.info(`Cronômetro encerrado: ${Math.round(minutos)} minutos`);
    return res.json({
      sessao,
      duracao_min: Math.round(minutos),
      auto_registrado: minutos >= 1
    });
  } catch (err) {
    logger.error('Erro ao encerrar sessão:', err.message);
    return res.status(500).json({ erro: 'Erro ao encerrar cronômetro' });
  }
}

/**
 * GET /api/cronometro/historico
 * Lista sessões encerradas do usuário (últimas 30)
 */
async function historico(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         s.id,
         s.iniciado_em,
         s.encerrado_em,
         s.duracao_seg,
         m.nome AS materia_nome,
         m.cor  AS materia_cor
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

module.exports = { buscarAtiva, iniciar, pausar, encerrar, historico };
