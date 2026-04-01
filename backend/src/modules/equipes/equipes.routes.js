const express = require('express');
const router = express.Router();
const controller = require('./equipes.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth');

router.use(requireAuth);

router.get('/', controller.listar);

// IMPORTANT: More specific routes MUST come BEFORE /:id
router.get('/:id/membros', controller.listarMembros);
router.post('/:id/membros', requireRole('admin', 'supervisor'), controller.adicionarMembro);
router.delete('/:id/membros/:idUsuario', requireRole('admin', 'supervisor'), controller.removerMembro);

// Generic /:id routes MUST come last
router.get('/:id', controller.buscarPorId);
router.put('/:id', requireRole('admin', 'supervisor'), controller.atualizar);
router.delete('/:id', requireRole('admin'), controller.excluir);

router.post('/', requireRole('admin', 'supervisor'), controller.criar);

module.exports = router;
