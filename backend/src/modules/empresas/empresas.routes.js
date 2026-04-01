/**
 * Empresas Routes
 * Rotas para operações relacionadas a empresas
 */

const express = require('express');
const router = express.Router();
const controller = require('./empresas.controller');
const { requireAuth } = require('../../middlewares/auth');

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// Buscar empresa atual do usuário logado
router.get('/atual', controller.buscarAtual);

module.exports = router;
