const service = require('./equipes.service');

async function listar(req, res) {
  try {
    const equipes = await service.listar(req.usuario.id_empresa);
    res.json(equipes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const equipe = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function listarMembros(req, res) {
  try {
    const membros = await service.listarMembros(req.params.id);
    res.json(membros);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const equipe = await service.criar({ id_empresa: req.usuario.id_empresa, ...req.body });
    res.status(201).json(equipe);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const equipe = await service.atualizar(req.usuario.id_empresa, req.params.id, req.body);
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    res.json(equipe);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function adicionarMembro(req, res) {
  try {
    const { id_usuario } = req.body;
    const result = await service.adicionarMembro(req.params.id, id_usuario);
    res.json({ mensagem: 'Membro adicionado com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function removerMembro(req, res) {
  try {
    const result = await service.removerMembro(req.params.id, req.params.idUsuario);
    if (!result) return res.status(404).json({ erro: 'Membro não encontrado na equipe' });
    res.json({ mensagem: 'Membro removido com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const deleted = await service.excluir(req.usuario.id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Equipe não encontrada' });
    res.json({ mensagem: 'Equipe excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { 
  listar, buscarPorId, listarMembros, criar, atualizar, 
  adicionarMembro, removerMembro, excluir 
};
