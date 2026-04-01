/**
 * Controller para Tarefas Recorrentes
 */

const service = require('./tarefas-recorrentes.service');

/**
 * Listar modelos de tarefas recorrentes
 */
async function listar(req, res) {
  try {
    const modelos = await service.listar(req.usuario.id_empresa, req.query);
    res.json(modelos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

/**
 * Buscar modelo por ID
 */
async function buscarPorId(req, res) {
  try {
    const modelo = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!modelo) {
      return res.status(404).json({ erro: 'Modelo não encontrado' });
    }
    res.json(modelo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

/**
 * Criar modelo de tarefa recorrente
 */
async function criar(req, res) {
  try {
    const modelo = await service.criar({
      id_empresa: req.usuario.id_empresa,
      criado_por: req.usuario.id_usuario,
      ...req.body
    });
    res.status(201).json(modelo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

/**
 * Atualizar modelo de tarefa recorrente
 */
async function atualizar(req, res) {
  try {
    const modelo = await service.atualizar(
      req.usuario.id_empresa,
      req.params.id,
      req.body
    );
    if (!modelo) {
      return res.status(404).json({ erro: 'Modelo não encontrado' });
    }
    res.json(modelo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

/**
 * Desativar modelo de tarefa recorrente
 */
async function desativar(req, res) {
  try {
    const modelo = await service.desativar(req.usuario.id_empresa, req.params.id);
    if (!modelo) {
      return res.status(404).json({ erro: 'Modelo não encontrado' });
    }
    res.json({ mensagem: 'Modelo desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

/**
 * Gerar tarefas do dia (endpoint para触发ar manualmente ou via cron)
 */
async function gerarTarefasDoDia(req, res) {
  try {
    const tarefas = await service.gerarTarefasDoDia(req.usuario.id_empresa);
    res.json({
      mensagem: `Geradas ${tarefas.length} tarefas para hoje`,
      tarefas: tarefas
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  desativar,
  gerarTarefasDoDia
};
