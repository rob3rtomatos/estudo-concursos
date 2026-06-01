/**
 * cronService.js - Agendamentos automáticos via node-cron
 * Executa às 8h e 20h para gerar lembretes de estudo
 * Para testar: altere os schedules abaixo para "* * * * *" (a cada minuto)
 */

const cron   = require('node-cron');
const { query } = require('../utils/db');
const logger    = require('../utils/logger');

/**
 * Gera notificações no banco para usuários que não registraram
 * horas no dia atual (serão exibidas pelo frontend)
 */
async function gerarLembretes() {
  logger.info('⏰ Cron: verificando usuários sem registro hoje...');
  try {
    // Buscar usuários ativos que possuem ciclo configurado
    // mas ainda NÃO registraram horas hoje
    const { rows: usuarios } = await query(
      `SELECT DISTINCT u.id, u.nome
       FROM usuarios u
       JOIN ciclo_estudo c ON c.usuario_id = u.id
       WHERE u.ativo = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM registro_estudo r
           WHERE r.usuario_id = u.id
             AND r.data_estudo = CURRENT_DATE
         )
         AND NOT EXISTS (
           SELECT 1 FROM notificacoes n
           WHERE n.usuario_id = u.id
             AND n.data_envio::date = CURRENT_DATE
             AND n.tipo = 'lembrete'
         )`,
      []
    );

    if (usuarios.length === 0) {
      logger.info('✅ Cron: todos os usuários já registraram horas hoje');
      return;
    }

    // Inserir notificação para cada usuário pendente
    for (const u of usuarios) {
      const hora = new Date().getHours();
      const periodo = hora < 12 ? 'manhã' : 'noite';
      const mensagem = `Olá, ${u.nome}! 📚 Você ainda não registrou horas de estudo hoje. Que tal começar agora? Bons estudos!`;

      await query(
        `INSERT INTO notificacoes (usuario_id, mensagem, tipo)
         VALUES ($1, $2, 'lembrete')`,
        [u.id, mensagem]
      );
      logger.info(`📬 Notificação criada para usuário ID ${u.id}`);
    }

    logger.info(`✅ Cron: ${usuarios.length} notificações geradas`);
  } catch (err) {
    logger.error('❌ Erro no cron de notificações:', err.message);
  }
}

/**
 * Inicia os agendamentos cron
 * Schedule: "0 8 * * *"  = todo dia às 08:00
 *           "0 20 * * *" = todo dia às 20:00
 */
function iniciarCron() {
  // Lembrete matutino às 08:00
  cron.schedule('0 8 * * *', gerarLembretes, {
    timezone: 'America/Sao_Paulo'
  });

  // Lembrete noturno às 20:00
  cron.schedule('0 20 * * *', gerarLembretes, {
    timezone: 'America/Sao_Paulo'
  });

  logger.info('⏰ Cron agendado: 08:00 e 20:00 (America/Sao_Paulo)');
}

module.exports = { iniciarCron, gerarLembretes };
