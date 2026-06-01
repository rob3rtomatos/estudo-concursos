const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || 'study_user',
  password: process.env.DB_PASSWORD || 'study_password',
  database: 'study_test',
});

async function setupSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      nome VARCHAR(100) NOT NULL,
      cor VARCHAR(20) DEFAULT '#6366f1',
      criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS registro_estudo (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
      data_estudo DATE NOT NULL,
      horas_estudadas NUMERIC(4,1) NOT NULL CHECK (horas_estudadas >= 0),
      observacoes TEXT,
      criado_em TIMESTAMP DEFAULT now(),
      UNIQUE(usuario_id, materia_id, data_estudo)
    );
    CREATE TABLE IF NOT EXISTS sessoes_estudo (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
      iniciado_em TIMESTAMP NOT NULL DEFAULT now(),
      encerrado_em TIMESTAMP,
      duracao_seg INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      pausado BOOLEAN DEFAULT false,
      pausado_em TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ciclo_estudo (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
      horas_planejadas NUMERIC(5,1) NOT NULL,
      criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS questoes (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
      banca VARCHAR(50),
      ano INTEGER,
      dificuldade VARCHAR(20) DEFAULT 'medio',
      enunciado TEXT NOT NULL,
      gabarito TEXT,
      criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS simulados (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo VARCHAR(150) NOT NULL,
      tempo_min INTEGER,
      criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS simulado_questoes (
      simulado_id INTEGER REFERENCES simulados(id) ON DELETE CASCADE,
      questao_id  INTEGER REFERENCES questoes(id)  ON DELETE CASCADE,
      PRIMARY KEY (simulado_id, questao_id)
    );
    CREATE TABLE IF NOT EXISTS cursos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      nome VARCHAR(150) NOT NULL,
      plataforma VARCHAR(100),
      progresso NUMERIC(5,2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'em_andamento',
      cor VARCHAR(20) DEFAULT '#6366f1',
      atualizado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS notificacoes (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      mensagem TEXT NOT NULL,
      lida BOOLEAN DEFAULT false,
      criado_em TIMESTAMP DEFAULT now()
    );
  `;
  await pool.query(schemaSql);
}

async function clearTables() {
  await pool.query(`
    TRUNCATE notificacoes, simulado_questoes, simulados, questoes,
             cursos, ciclo_estudo, sessoes_estudo,
             registro_estudo, materias, usuarios
    RESTART IDENTITY CASCADE
  `);
}

module.exports = { pool, setupSchema, clearTables };
