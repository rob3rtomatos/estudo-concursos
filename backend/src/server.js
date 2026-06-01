/**
 * server.js - Ponto de entrada do servidor
 * Inicializa o Express, conecta ao banco e sobe na porta configurada
 */

require('dotenv').config();
const app    = require('./app');
const { testConnection } = require('./utils/db');
const logger = require('./utils/logger');
const { iniciarCron } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

/**
 * Inicializa o servidor após verificar conexão com o banco
 */
async function start() {
  try {
    // Testar conexão com o PostgreSQL antes de subir
    await testConnection();
    logger.info('✅ Conexão com PostgreSQL estabelecida com sucesso');

    // Iniciar agendamentos de notificações
    iniciarCron();
    logger.info('⏰ Serviço de notificações cron iniciado');

    // Subir o servidor HTTP
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Backend rodando em http://0.0.0.0:${PORT}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('❌ Falha ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

start();
