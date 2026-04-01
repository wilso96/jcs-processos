const express = require('express');
const router = express.Router();
const controller = require('./turnos.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth');

router.use(requireAuth);

router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', requireRole('admin', 'supervisor'), controller.criar);
router.put('/:id', requireRole('admin', 'supervisor'), controller.atualizar);
router.delete('/:id', requireRole('admin'), controller.excluir);

module.exports = router;
