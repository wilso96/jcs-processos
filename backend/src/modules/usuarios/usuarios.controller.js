const service = require('./usuarios.service');

async function listar(req, res) {
  try {
    const dados = await service.listar(req.usuario.id_empresa);
    return res.json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function buscar(req, res) {
  try {
    const dados = await service.buscar(req.params.id, req.usuario.id_empresa);
    return res.json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function criar(req, res) {
  try {
    const dados = await service.criar({
      ...req.body,
      id_empresa: req.usuario.id_empresa
    });
    return res.status(201).json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function atualizar(req, res) {
  try {
    const dados = await service.atualizar(req.params.id, req.body, req.usuario.id_empresa);
    return res.json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function excluir(req, res) {
  try {
    await service.excluir(req.params.id, req.usuario.id_empresa);
    return res.json({ mensagem: 'Usuario excluido com sucesso' });
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };