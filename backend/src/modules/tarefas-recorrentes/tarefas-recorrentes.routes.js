/**
 * Routes para Tarefas Recorrentes
 */

const express = require('express');
const router = express.Router();
const controller = require('./tarefas-recorrentes.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth');

router.use(requireAuth);

// Rotas com parâmetros (colocar ANTES das rotas com :id)
router.post('/gerar-diarias', requireRole('admin', 'supervisor'), controller.gerarTarefasDoDia);

// GET /tarefas-recorrentes - Listar modelos
router.get('/', controller.listar);

// Rotas com :id DEVEM vir por último
// GET /tarefas-recorrentes/:id - Buscar por ID
router.get('/:id', controller.buscarPorId);

// POST /tarefas-recorrentes - Criar modelo (admin/supervisor)
router.post('/', requireRole('admin', 'supervisor'), controller.criar);

// PUT /tarefas-recorrentes/:id - Atualizar modelo (admin/supervisor)
router.put('/:id', requireRole('admin', 'supervisor'), controller.atualizar);

// DELETE /tarefas-recorrentes/:id - Desativar modelo (admin/supervisor)
router.delete('/:id', requireRole('admin', 'supervisor'), controller.desativar);

module.exports = router;
