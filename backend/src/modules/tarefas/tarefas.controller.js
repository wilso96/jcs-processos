const service = require('./tarefas.service');

async function listar(req, res) {
  try {
    const id_usuario = req.usuario.perfil === 'colaborador' ? req.usuario.id_usuario : null;
    const result = await service.listar(req.usuario.id_empresa, req.query, id_usuario);
    res.json(result);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const tarefa = await service.buscarPorId(req.usuario.id_empresa, req.params.id);
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarItens(req, res) {
  try {
    const itens = await service.buscarItensExecucao(req.params.id);
    res.json(itens);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const tarefa = await service.criar({ 
      id_empresa: req.usuario.id_empresa, 
      criado_por: req.usuario.id_usuario,
      ...req.body 
    });
    res.status(201).json(tarefa);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const tarefa = await service.atualizar(req.usuario.id_empresa, req.params.id, req.body);
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function executarItem(req, res) {
  try {
    const { id_item_modelo, resposta, observacao, foto_url } = req.body;
    const result = await service.executarItem(
      req.params.id, 
      id_item_modelo, 
      { resposta, observacao, foto_url },
      req.usuario.id_usuario
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function adicionarComentario(req, res) {
  try {
    const { comentario } = req.body;
    const result = await service.adicionarComentario(req.params.id, req.usuario.id_usuario, comentario);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function listarComentarios(req, res) {
  try {
    const comentarios = await service.listarComentarios(req.params.id);
    res.json(comentarios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function listarHistorico(req, res) {
  try {
    const historico = await service.listarHistorico(req.params.id);
    res.json(historico);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const deleted = await service.excluir(req.usuario.id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Tarefa não encontrada' });
    res.json({ mensagem: 'Tarefa excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { 
  listar, buscarPorId, buscarItens, criar, atualizar, 
  executarItem, adicionarComentario, listarComentarios, listarHistorico, excluir 
};
