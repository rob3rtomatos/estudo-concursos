-- ============================================================
-- init-db.sql - Esquema inicial do PostgreSQL
-- Executado automaticamente na primeira criação do container
-- ============================================================

-- Extensão para UUIDs (opcional, usando SERIAL por simplicidade)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- Tabela: usuarios
-- Armazena dados de autenticação dos usuários da plataforma
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL,          -- bcrypt hash
    criado_em     TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    ativo         BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- -----------------------------------------------------------
-- Tabela: materias
-- Disciplinas de estudo vinculadas a cada usuário
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS materias (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome        VARCHAR(100) NOT NULL,
    cor         VARCHAR(7) DEFAULT '#3B82F6',      -- Cor hex para UI
    criado_em   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materias_usuario ON materias(usuario_id);

-- -----------------------------------------------------------
-- Tabela: ciclo_estudo
-- Define o planejamento semanal: dia x matéria x horas planejadas
-- dia_semana: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ciclo_estudo (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id       INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    dia_semana       SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    horas_planejadas NUMERIC(4,1) NOT NULL CHECK (horas_planejadas > 0),
    ordem            SMALLINT DEFAULT 0,
    criado_em        TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, materia_id, dia_semana)
);
CREATE INDEX IF NOT EXISTS idx_ciclo_usuario_dia ON ciclo_estudo(usuario_id, dia_semana);

-- -----------------------------------------------------------
-- Tabela: registro_estudo
-- Registro diário de horas efetivamente estudadas por matéria
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS registro_estudo (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id       INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    data_estudo      DATE NOT NULL,
    horas_estudadas  NUMERIC(4,1) NOT NULL CHECK (horas_estudadas >= 0),
    observacoes      TEXT,
    criado_em        TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, materia_id, data_estudo)
);
CREATE INDEX IF NOT EXISTS idx_registro_usuario_data   ON registro_estudo(usuario_id, data_estudo);
CREATE INDEX IF NOT EXISTS idx_registro_materia        ON registro_estudo(materia_id);
CREATE INDEX IF NOT EXISTS idx_registro_data           ON registro_estudo(data_estudo);

-- -----------------------------------------------------------
-- Tabela: notificacoes
-- Notificações criadas pelo cron do backend para cada usuário
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificacoes (
    id           SERIAL PRIMARY KEY,
    usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensagem     TEXT NOT NULL,
    tipo         VARCHAR(30) DEFAULT 'lembrete',  -- lembrete | conquista | aviso
    lida         BOOLEAN DEFAULT FALSE,
    data_envio   TIMESTAMP DEFAULT NOW(),
    data_leitura TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notif_usuario_lida ON notificacoes(usuario_id, lida);

-- -----------------------------------------------------------
-- Tabela: sessoes
-- Refresh tokens para renovação silenciosa de JWT
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessoes (
    id            SERIAL PRIMARY KEY,
    usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at    TIMESTAMP NOT NULL,
    criado_em     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessoes_token   ON sessoes(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);

-- -----------------------------------------------------------
-- Função e trigger para atualizar "atualizado_em" automaticamente
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- -----------------------------------------------------------
-- Tabela: sessoes_estudo
-- Registra sessões do cronômetro (início, fim, matéria, duração)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessoes_estudo (
    id           SERIAL PRIMARY KEY,
    usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    materia_id   INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    iniciado_em  TIMESTAMP NOT NULL DEFAULT NOW(),
    encerrado_em TIMESTAMP,                        -- NULL = ainda em andamento
    duracao_seg  INTEGER DEFAULT 0,                -- Duração total em segundos
    ativo        BOOLEAN DEFAULT TRUE              -- TRUE = cronômetro rodando
);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_usuario ON sessoes_estudo(usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_materia ON sessoes_estudo(materia_id);
