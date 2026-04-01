const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth');

// Todos os endpoints do dashboard requerem autenticação
// Apenas admin e supervisor têm acesso
router.use(requireAuth);
router.use(requireRole('admin', 'supervisor'));

// Estatísticas gerais
router.get('/estatisticas', controller.estatisticasGerais);

// Tarefas por status (para gráfico)
router.get('/tarefas/status', controller.tarefasPorStatus);

// Tarefas por prioridade (para gráfico)
router.get('/tarefas/prioridade', controller.tarefasPorPrioridade);

// Tarefas por área (para gráfico)
router.get('/tarefas/areas', controller.tarefasPorArea);

// Tarefas por responsável (para gráfico)
router.get('/tarefas/responsaveis', controller.tarefasPorResponsavel);

// Tarefas recentes
router.get('/tarefas/recentes', controller.tarefasRecentes);

// Tarefas atrasadas
router.get('/tarefas/atrasadas', controller.tarefasAtrasadas);

// Produtividade diária (para gráfico de linha)
router.get('/produtividade', controller.produtividadeDiaria);

module.exports = router;
