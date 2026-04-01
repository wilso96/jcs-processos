const express = require('express');
const router = express.Router();
const controller = require('./usuarios.controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/', requireAuth, controller.listar);
router.get('/:id', requireAuth, controller.buscar);
router.post('/', requireAuth, controller.criar);
router.put('/:id', requireAuth, controller.atualizar);
router.delete('/:id', requireAuth, controller.excluir);

module.exports = router;