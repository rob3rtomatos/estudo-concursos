/**
 * db.js - Configuração e pool de conexão com o PostgreSQL
 * Usa o módulo 'pg' (node-postgres) com pool de conexões
 */

const { Pool } = require('pg');
const logger   = require('./logger');

// Pool de conexões: reutiliza conexões abertas para performance
const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres',  // Nome do serviço Docker
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || 'study_user',
  password: process.env.DB_PASSWORD || 'study_password',
  database: process.env.DB_NAME     || 'study_db',
  max:      10,              // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,  // Fechar conexão inativa após 30s
  connectionTimeoutMillis: 5000  // Timeout ao conectar
});

// Logar erros inesperados do pool
pool.on('error', (err) => {
  logger.error('Erro inesperado no pool do PostgreSQL:', err.message);
});

/**
 * Testa se a conexão com o banco está funcionando
 * @returns {Promise<void>}
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
  } finally {
    client.release();  // Sempre liberar a conexão de volta ao pool
  }
}

/**
 * Executa uma query SQL com parâmetros
 * @param {string} text  - SQL com placeholders ($1, $2, ...)
 * @param {Array}  params - Valores para os placeholders
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  const dur   = Date.now() - start;
  logger.debug(`Query executada em ${dur}ms: ${text.substring(0, 80)}`);
  return res;
}

module.exports = { pool, query, testConnection };
