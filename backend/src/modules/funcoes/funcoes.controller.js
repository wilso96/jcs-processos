const service = require('./funcoes.service');

async function listar(req, res) {
  try {
    const funcoes = await service.listar(req.usuario.id_empresa);
    res.json(funcoes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const funcao = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!funcao) return res.status(404).json({ erro: 'Função não encontrada' });
    res.json(funcao);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const funcao = await service.criar({ id_empresa: req.usuario.id_empresa, ...req.body });
    res.status(201).json(funcao);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const funcao = await service.atualizar(req.usuario.id_empresa, req.params.id, req.body);
    if (!funcao) return res.status(404).json({ erro: 'Função não encontrada' });
    res.json(funcao);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const deleted = await service.excluir(req.usuario.id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Função não encontrada' });
    res.json({ mensagem: 'Função excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
