const service = require('./areas.service');

async function listar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const dados = await service.listar(id_empresa);
    res.json(dados);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const area = await service.buscarPorId(id_empresa, req.params.id);
    if (!area) return res.status(404).json({ erro: 'Area nao encontrada' });
    res.json(area);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

async function criar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const dados = await service.criar({ id_empresa, ...req.body });
    res.status(201).json(dados);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function atualizar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const area = await service.atualizar(id_empresa, req.params.id, req.body);
    if (!area) return res.status(404).json({ erro: 'Area nao encontrada' });
    res.json(area);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function excluir(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const deleted = await service.excluir(id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Area nao encontrada' });
    res.json({ mensagem: 'Area excluida com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };