const express = require('express');
const router = express.Router();
const controller = require('./modelos.controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/', requireAuth, controller.listar);
router.get('/:id', requireAuth, controller.buscarPorId);
router.post('/', requireAuth, controller.criar);
router.post('/:id/itens', requireAuth, controller.criarItem);

module.exports = router;