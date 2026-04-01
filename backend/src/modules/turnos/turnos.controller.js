const service = require('./turnos.service');

async function listar(req, res) {
  try {
    const turnos = await service.listar(req.usuario.id_empresa);
    res.json(turnos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const turno = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!turno) return res.status(404).json({ erro: 'Turno não encontrado' });
    res.json(turno);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const turno = await service.criar({ id_empresa: req.usuario.id_empresa, ...req.body });
    res.status(201).json(turno);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const turno = await service.atualizar(req.usuario.id_empresa, req.params.id, req.body);
    if (!turno) return res.status(404).json({ erro: 'Turno não encontrado' });
    res.json(turno);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const deleted = await service.excluir(req.usuario.id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Turno não encontrado' });
    res.json({ mensagem: 'Turno excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
