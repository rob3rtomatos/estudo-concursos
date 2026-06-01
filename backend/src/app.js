require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const logger  = require('./utils/logger');

const authRoutes         = require('./routes/authRoutes');
const materiasRoutes     = require('./routes/materiasRoutes');
const cicloRoutes        = require('./routes/cicloRoutes');
const registroRoutes     = require('./routes/registroRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');
const cronometroRoutes   = require('./routes/cronometroRoutes');
const questoesRoutes     = require('./routes/questoesRoutes');
const simuladosRoutes    = require('./routes/simuladosRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => { logger.info(`${req.method} ${req.originalUrl}`); next(); });

app.use('/api/auth',         authRoutes);
app.use('/api/materias',     materiasRoutes);
app.use('/api/ciclos',       cicloRoutes);
app.use('/api/registros',    registroRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/cronometro',   cronometroRoutes);
app.use('/api/questoes',     questoesRoutes);
app.use('/api/simulados',    simuladosRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((err, _req, res, _next) => {
  logger.error('Erro:', err.message);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno' });
});

module.exports = app;
