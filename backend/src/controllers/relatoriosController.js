/**
 * relatoriosController.js
 * Coleta todos os dados do aluno para geração do relatório no frontend
 * O PDF é gerado no browser (jsPDF) — o backend fornece os dados consolidados
 */

const { query } = require('../utils/db');
const logger    = require('../utils/logger');

async function gerar(req, res) {
  const uid = req.usuario.id;

  try {
    const [
      usuario,
      resumoEstudo,
      porMateria,
      porDia30,
      ciclo,
      cursos,
      questoes,
      simulados,
      sessoesCronometro,
      metaSemanal
    ] = await Promise.all([

      // Dados do usuário (nome, email)
      query(`SELECT nome, email, criado_em FROM usuarios WHERE id = $1`, [uid]),

      // Resumo geral de estudo
      query(`SELECT
               COALESCE(SUM(horas_estudadas),0)::float   AS total_horas,
               COUNT(DISTINCT data_estudo)::int           AS dias_estudados,
               COUNT(DISTINCT materia_id)::int            AS materias_estudadas,
               MIN(data_estudo)                           AS primeiro_registro,
               MAX(data_estudo)                           AS ultimo_registro
             FROM registro_estudo WHERE usuario_id = $1`, [uid]),

      // Horas por matéria (todos os tempos)
      query(`SELECT m.nome, m.cor,
               ROUND(SUM(r.horas_estudadas)::numeric, 2) AS total_horas,
               COUNT(DISTINCT r.data_estudo)::int         AS dias
             FROM registro_estudo r
             JOIN materias m ON m.id = r.materia_id
             WHERE r.usuario_id = $1
             GROUP BY m.id, m.nome, m.cor
             ORDER BY total_horas DESC`, [uid]),

      // Horas por dia — últimos 30 dias
      query(`SELECT data_estudo::text AS data,
               ROUND(SUM(horas_estudadas)::numeric, 2) AS horas
             FROM registro_estudo
             WHERE usuario_id = $1
               AND data_estudo >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY data_estudo ORDER BY data_estudo`, [uid]),

      // Ciclo semanal configurado
      query(`SELECT c.dia_semana, c.horas_planejadas,
               m.nome AS materia_nome, m.cor
             FROM ciclo_estudo c
             JOIN materias m ON m.id = c.materia_id
             WHERE c.usuario_id = $1
             ORDER BY c.dia_semana, m.nome`, [uid]),

      // Cursos
      query(`SELECT nome, plataforma, carga_horaria, progresso, status, criado_em
             FROM cursos WHERE usuario_id = $1
             ORDER BY criado_em DESC`, [uid]),

      // Questões: totais por banca e dificuldade
      query(`SELECT
               COUNT(*)::int                                       AS total,
               COUNT(*) FILTER (WHERE dificuldade='facil')::int    AS faceis,
               COUNT(*) FILTER (WHERE dificuldade='media')::int    AS medias,
               COUNT(*) FILTER (WHERE dificuldade='dificil')::int  AS dificeis,
               COUNT(DISTINCT banca)::int                          AS bancas
             FROM questoes WHERE usuario_id = $1`, [uid]),

      // Simulados com desempenho médio
      query(`SELECT s.titulo, s.tempo_min,
               COUNT(DISTINCT sq.questao_id)::int AS total_questoes,
               ROUND(AVG(CASE WHEN sr.correta THEN 100.0 ELSE 0 END)::numeric, 1)
                 AS percentual_medio,
               s.criado_em
             FROM simulados s
             LEFT JOIN simulado_questoes sq ON sq.simulado_id = s.id
             LEFT JOIN simulado_respostas sr ON sr.simulado_id = s.id AND sr.usuario_id = $1
             WHERE s.usuario_id = $1
             GROUP BY s.id ORDER BY s.criado_em DESC`, [uid]),

      // Sessões do cronômetro encerradas
      query(`SELECT
               COUNT(*)::int                                    AS total_sessoes,
               COALESCE(SUM(duracao_seg),0)::int               AS total_segundos,
               ROUND(AVG(duracao_seg)::numeric/60, 1)          AS media_min_sessao
             FROM sessoes_estudo
             WHERE usuario_id = $1 AND ativo = FALSE`, [uid]),

      // Meta semanal atual
      query(`SELECT
               COALESCE(SUM(c.horas_planejadas),0)::float AS planejado,
               COALESCE(SUM(r.horas_estudadas),0)::float  AS estudado
             FROM ciclo_estudo c
             LEFT JOIN registro_estudo r
               ON r.materia_id = c.materia_id AND r.usuario_id = c.usuario_id
               AND r.data_estudo >= DATE_TRUNC('week', CURRENT_DATE)
               AND r.data_estudo <  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
             WHERE c.usuario_id = $1`, [uid])
    ]);

    return res.json({
      geradoEm:          new Date().toISOString(),
      usuario:           usuario.rows[0],
      resumoEstudo:      resumoEstudo.rows[0],
      porMateria:        porMateria.rows,
      porDia30:          porDia30.rows,
      ciclo:             ciclo.rows,
      cursos:            cursos.rows,
      questoes:          questoes.rows[0],
      simulados:         simulados.rows,
      sessoesCronometro: sessoesCronometro.rows[0],
      metaSemanal:       metaSemanal.rows[0]
    });
  } catch (err) {
    logger.error('Erro ao gerar relatório:', err.message);
    return res.status(500).json({ erro: 'Erro ao gerar dados do relatório' });
  }
}

module.exports = { gerar };
