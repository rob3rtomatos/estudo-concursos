const { query } = require('../utils/db');
const logger    = require('../utils/logger');

async function resumo(req, res) {
  const uid = req.usuario.id;
  try {
    const [porDia, porMateria, metaSemanal, totalHoje,
           totalQuestoes, totalSimulados, ultimasQuestoes, ultimosSimulados] =
      await Promise.all([
        // Horas por dia (7 dias)
        query(`SELECT data_estudo::text AS data,
                 ROUND(SUM(horas_estudadas)::numeric,1) AS total_horas
               FROM registro_estudo
               WHERE usuario_id=$1 AND data_estudo >= CURRENT_DATE - INTERVAL '6 days'
               GROUP BY data_estudo ORDER BY data_estudo`, [uid]),

        // Horas por matéria (30 dias)
        query(`SELECT m.nome AS materia, m.cor,
                 ROUND(SUM(r.horas_estudadas)::numeric,1) AS total_horas
               FROM registro_estudo r JOIN materias m ON m.id=r.materia_id
               WHERE r.usuario_id=$1 AND r.data_estudo >= CURRENT_DATE - INTERVAL '29 days'
               GROUP BY m.id,m.nome,m.cor ORDER BY total_horas DESC`, [uid]),

        // Meta semanal
        query(`SELECT
                 ROUND(SUM(c.horas_planejadas)::numeric,1) AS horas_planejadas,
                 COALESCE(ROUND(SUM(r.horas_estudadas)::numeric,1),0) AS horas_estudadas
               FROM ciclo_estudo c
               LEFT JOIN registro_estudo r
                 ON r.materia_id=c.materia_id AND r.usuario_id=c.usuario_id
                 AND r.data_estudo >= DATE_TRUNC('week',CURRENT_DATE)
                 AND r.data_estudo <  DATE_TRUNC('week',CURRENT_DATE)+INTERVAL '7 days'
               WHERE c.usuario_id=$1`, [uid]),

        // Total hoje
        query(`SELECT COALESCE(ROUND(SUM(horas_estudadas)::numeric,1),0) AS total
               FROM registro_estudo WHERE usuario_id=$1 AND data_estudo=CURRENT_DATE`, [uid]),

        // Total de questões
        query(`SELECT COUNT(*)::int AS total FROM questoes WHERE usuario_id=$1`, [uid]),

        // Total de simulados
        query(`SELECT COUNT(*)::int AS total FROM simulados WHERE usuario_id=$1`, [uid]),

        // Últimas 5 questões
        query(`SELECT q.id, q.banca, q.ano, q.dificuldade,
                 LEFT(q.enunciado,80) AS enunciado_curto,
                 m.nome AS materia_nome, m.cor AS materia_cor, q.criado_em
               FROM questoes q LEFT JOIN materias m ON m.id=q.materia_id
               WHERE q.usuario_id=$1 ORDER BY q.criado_em DESC LIMIT 5`, [uid]),

        // Últimos 5 simulados
        query(`SELECT s.id, s.titulo, s.tempo_min, s.criado_em,
                 COUNT(sq.questao_id)::int AS total_questoes
               FROM simulados s
               LEFT JOIN simulado_questoes sq ON sq.simulado_id=s.id
               WHERE s.usuario_id=$1
               GROUP BY s.id ORDER BY s.criado_em DESC LIMIT 5`, [uid])
      ]);

    return res.json({
      porDia:          porDia.rows,
      porMateria:      porMateria.rows,
      metaSemanal:     metaSemanal.rows[0] || { horas_planejadas: 0, horas_estudadas: 0 },
      totalHoje:       parseFloat(totalHoje.rows[0]?.total || 0),
      totalQuestoes:   totalQuestoes.rows[0].total,
      totalSimulados:  totalSimulados.rows[0].total,
      ultimasQuestoes: ultimasQuestoes.rows,
      ultimosSimulados: ultimosSimulados.rows
    });
  } catch (err) {
    logger.error('Erro no dashboard:', err.message);
    return res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
}

module.exports = { resumo };
