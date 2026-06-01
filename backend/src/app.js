require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const logger  = require('./utils/logger');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`); next();
});

const rotas = [
  ['./routes/authRoutes',         '/api/auth'],
  ['./routes/materiasRoutes',     '/api/materias'],
  ['./routes/cicloRoutes',        '/api/ciclos'],
  ['./routes/registroRoutes',     '/api/registros'],
  ['./routes/dashboardRoutes',    '/api/dashboard'],
  ['./routes/notificacoesRoutes', '/api/notificacoes'],
  ['./routes/cronometroRoutes',   '/api/cronometro'],
  ['./routes/questoesRoutes',     '/api/questoes'],
  ['./routes/simuladosRoutes',    '/api/simulados'],
  ['./routes/cursosRoutes',       '/api/cursos'],
  ['./routes/relatoriosRoutes',   '/api/relatorios'],
];

rotas.forEach(([caminho, prefixo]) => {
  try {
    app.use(prefixo, require(caminho));
    logger.info(`✅ Rota registrada: ${prefixo}`);
  } catch (err) {
    logger.error(`❌ Falha ao carregar ${caminho}: ${err.message}`);
  }
});

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((err, _req, res, _next) => {
  logger.error('Erro global:', err.message);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno' });
});

module.exports = app;
