const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || 'study_user',
  password: process.env.DB_PASSWORD || 'study_password',
  database: 'study_test',
});

async function setupSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL, senha_hash VARCHAR(255) NOT NULL,
      ativo BOOLEAN DEFAULT true, criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessoes (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      refresh_token TEXT NOT NULL, expires_at TIMESTAMP NOT NULL, criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nome VARCHAR(100) NOT NULL, cor VARCHAR(20) DEFAULT '#6366f1', criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS registro_estudo (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
      data_estudo DATE NOT NULL, horas_estudadas NUMERIC(4,1) NOT NULL CHECK (horas_estudadas >= 0),
      observacoes TEXT, criado_em TIMESTAMP DEFAULT now(),
      UNIQUE(usuario_id, materia_id, data_estudo)
    );
    CREATE TABLE IF NOT EXISTS sessoes_estudo (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
      iniciado_em TIMESTAMP NOT NULL DEFAULT now(), encerrado_em TIMESTAMP,
      duracao_seg INTEGER DEFAULT 0, ativo BOOLEAN DEFAULT true,
      pausado BOOLEAN DEFAULT false, pausado_em TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ciclo_estudo (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
      dia_semana SMALLINT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
      horas_planejadas NUMERIC(4,1) NOT NULL CHECK (horas_planejadas > 0),
      ordem SMALLINT DEFAULT 0, criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS questoes (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      materia_id INTEGER REFERENCES materias(id) ON DELETE SET NULL,
      banca VARCHAR(100), ano SMALLINT, enunciado TEXT NOT NULL,
      alternativa_a TEXT, alternativa_b TEXT, alternativa_c TEXT, alternativa_d TEXT, alternativa_e TEXT,
      gabarito CHAR(1) CHECK (gabarito = ANY(ARRAY['A','B','C','D','E'])),
      comentario TEXT, dificuldade VARCHAR(10) DEFAULT 'media' CHECK (dificuldade = ANY(ARRAY['facil','media','dificil'])),
      criado_em TIMESTAMP DEFAULT now(), atualizado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS simulados (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo VARCHAR(150) NOT NULL, tempo_min INTEGER, criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS simulado_questoes (
      simulado_id INTEGER NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
      questao_id INTEGER NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
      PRIMARY KEY (simulado_id, questao_id)
    );
    CREATE TABLE IF NOT EXISTS simulado_respostas (
      id SERIAL PRIMARY KEY, simulado_id INTEGER NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
      questao_id INTEGER NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
      resposta CHAR(1), criado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS cursos (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nome VARCHAR(200) NOT NULL, descricao TEXT, plataforma VARCHAR(100),
      carga_horaria INTEGER DEFAULT 0,
      progresso SMALLINT DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
      status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status = ANY(ARRAY['nao_iniciado','em_andamento','concluido','pausado'])),
      cor VARCHAR(7) DEFAULT '#6366f1', criado_em TIMESTAMP DEFAULT now(), atualizado_em TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS curso_materias (
      curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
      materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
      PRIMARY KEY (curso_id, materia_id)
    );
    CREATE TABLE IF NOT EXISTS notificacoes (
      id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      mensagem TEXT NOT NULL, tipo VARCHAR(30) DEFAULT 'lembrete',
      lida BOOLEAN DEFAULT false, data_envio TIMESTAMP DEFAULT now(), data_leitura TIMESTAMP
    );
  `);
}

async function clearTables() {
  await pool.query(`
    TRUNCATE simulado_respostas, simulado_questoes, curso_materias, notificacoes, sessoes,
             simulados, questoes, cursos, ciclo_estudo, sessoes_estudo,
             registro_estudo, materias, usuarios
    RESTART IDENTITY CASCADE
  `);
}

module.exports = { pool, setupSchema, clearTables };
