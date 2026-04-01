const express = require('express');
const router = express.Router();
const controller = require('./unidades.controller');
const { requireAuth } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/auth');

router.use(requireAuth);

// CRUD básico
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', requireRole('admin', 'supervisor'), controller.criar);
router.put('/:id', requireRole('admin', 'supervisor'), controller.atualizar);
router.delete('/:id', requireRole('admin'), controller.excluir);

// ============================================
// ROTAS DE VINCULAÇÃO DE PROCESSOS
// ============================================
// IMPORTANT: More specific routes MUST come BEFORE /:id

// Listar processos vinculados à unidade
router.get('/:id/processos', controller.listarProcessos);

// Listar processos disponíveis para vincular
router.get('/:id/processos/disponiveis', controller.listarProcessosDisponiveis);

// Vincular processo à unidade
router.post('/:id/processos', requireRole('admin', 'supervisor'), controller.vincularProcesso);

// Desvincular processo da unidade
router.delete('/:id/processos/:idProcesso', requireRole('admin', 'supervisor'), controller.desvincularProcesso);

// ============================================
// ROTAS DE VINCULAÇÃO DE USUÁRIOS
// ============================================

// Listar usuários vinculados à unidade
router.get('/:id/usuarios', controller.listarUsuarios);

// Listar usuários disponíveis para vincular
router.get('/:id/usuarios/disponiveis', controller.listarUsuariosDisponiveis);

// Vincular usuário à unidade
router.post('/:id/usuarios', requireRole('admin', 'supervisor'), controller.vincularUsuario);

// Desvincular usuário da unidade
router.delete('/:id/usuarios/:idUsuario', requireRole('admin', 'supervisor'), controller.desvincularUsuario);

module.exports = router;
