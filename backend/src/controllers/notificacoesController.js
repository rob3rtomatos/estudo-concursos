/**
 * notificacoesController.js - Gerencia notificações internas do usuário
 */

const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/** GET /api/notificacoes - Lista notificações do usuário (mais recentes primeiro) */
async function listar(req, res) {
  const limite = parseInt(req.query.limite) || 20;
  try {
    const { rows } = await query(
      `SELECT id, mensagem, tipo, lida, data_envio, data_leitura
       FROM notificacoes
       WHERE usuario_id = $1
       ORDER BY data_envio DESC
       LIMIT $2`,
      [req.usuario.id, limite]
    );
    // Contar não lidas
    const { rows: contagem } = await query(
      'SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = $1 AND lida = FALSE',
      [req.usuario.id]
    );
    return res.json({
      notificacoes: rows,
      naoLidas: parseInt(contagem[0].total)
    });
  } catch (err) {
    logger.error('Erro ao listar notificações:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar notificações' });
  }
}

/** PATCH /api/notificacoes/:id/lida - Marca uma notificação como lida */
async function marcarLida(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `UPDATE notificacoes
       SET lida = TRUE, data_leitura = NOW()
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, lida`,
      [id, req.usuario.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Notificação não encontrada' });
    }
    return res.json({ notificacao: rows[0] });
  } catch (err) {
    logger.error('Erro ao marcar notificação:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar notificação' });
  }
}

/** PATCH /api/notificacoes/marcar-todas - Marca todas como lidas */
async function marcarTodas(req, res) {
  try {
    await query(
      `UPDATE notificacoes
       SET lida = TRUE, data_leitura = NOW()
       WHERE usuario_id = $1 AND lida = FALSE`,
      [req.usuario.id]
    );
    return res.json({ mensagem: 'Todas as notificações marcadas como lidas' });
  } catch (err) {
    logger.error('Erro ao marcar todas notificações:', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar notificações' });
  }
}

module.exports = { listar, marcarLida, marcarTodas };
