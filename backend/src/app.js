const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const areasRoutes = require('./modules/areas/areas.routes');
const modelosRoutes = require('./modules/modelos/modelos.routes');

// Novos módulos
const unidadesRoutes = require('./modules/unidades/unidades.routes');
const funcoesRoutes = require('./modules/funcoes/funcoes.routes');
const turnosRoutes = require('./modules/turnos/turnos.routes');
const equipesRoutes = require('./modules/equipes/equipes.routes');
const processosRoutes = require('./modules/processos/processos.routes');
const tarefasRoutes = require('./modules/tarefas/tarefas.routes');
const tarefasRecorrentesRoutes = require('./modules/tarefas-recorrentes/tarefas-recorrentes.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const empresasRoutes = require('./modules/empresas/empresas.routes');

const app = express();

// CORS - em produção restringe ao domínio do frontend
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rotas de autenticação
app.use('/auth', authRoutes);

// Rotas de cadastros
app.use('/usuarios', usuariosRoutes);
app.use('/areas', areasRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/funcoes', funcoesRoutes);
app.use('/turnos', turnosRoutes);
app.use('/equipes', equipesRoutes);
app.use('/empresas', empresasRoutes);

// Rotas de processos
app.use('/modelos', modelosRoutes);
app.use('/processos', processosRoutes);

// Rotas de tarefas
app.use('/tarefas', tarefasRoutes);
app.use('/tarefas-recorrentes', tarefasRecorrentesRoutes);

// Rotas de dashboard (supervisor/admin)
app.use('/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV });
});

// Fallback para SPA - servir index.html para rotas não encontradas
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;