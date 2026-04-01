const express = require('express');
const router = express.Router();
const controller = require('./tarefas.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth');

router.use(requireAuth);

// Listar tarefas (colaborador vê só as suas)
router.get('/', controller.listar);

// IMPORTANT: More specific routes MUST come BEFORE /:id
// Buscar itens de execução de uma tarefa
router.get('/:id/itens', controller.buscarItens);

// Listar comentários
router.get('/:id/comentarios', controller.listarComentarios);

// Listar histórico
router.get('/:id/historico', controller.listarHistorico);

// Buscar tarefa por ID (must be last among /:id routes)
router.get('/:id', controller.buscarPorId);

// Criar tarefa (admin/supervisor)
router.post('/', requireRole('admin', 'supervisor'), controller.criar);

// Atualizar tarefa
router.put('/:id', controller.atualizar);

// Executar item da tarefa (colaborador executa)
router.post('/:id/itens', controller.executarItem);

// Adicionar comentário
router.post('/:id/comentarios', controller.adicionarComentario);

// Excluir tarefa (admin)
router.delete('/:id', requireRole('admin'), controller.excluir);

module.exports = router;
