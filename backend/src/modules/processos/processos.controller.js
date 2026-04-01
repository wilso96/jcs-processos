const service = require('./processos.service');

async function listar(req, res) {
  try {
    const processos = await service.listar(req.usuario.id_empresa, req.query);
    res.json(processos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const processo = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!processo) return res.status(404).json({ erro: 'Processo não encontrado' });
    res.json(processo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const processo = await service.criar({ id_empresa: req.usuario.id_empresa, ...req.body });
    res.status(201).json(processo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const processo = await service.atualizar(req.usuario.id_empresa, req.params.id, req.body);
    if (!processo) return res.status(404).json({ erro: 'Processo não encontrado' });
    res.json(processo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const deleted = await service.excluir(req.usuario.id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
