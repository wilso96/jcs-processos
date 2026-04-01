const service = require('./unidades.service');

async function listar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const unidades = await service.listar(id_empresa);
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const unidade = await service.buscarPorId(id_empresa, req.params.id);
    if (!unidade) return res.status(404).json({ erro: 'Unidade não encontrada' });
    res.json(unidade);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function criar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const unidade = await service.criar({ id_empresa, ...req.body });
    res.status(201).json(unidade);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const unidade = await service.atualizar(id_empresa, req.params.id, req.body);
    if (!unidade) return res.status(404).json({ erro: 'Unidade não encontrada' });
    res.json(unidade);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function excluir(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const deleted = await service.excluir(id_empresa, req.params.id);
    if (!deleted) return res.status(404).json({ erro: 'Unidade não encontrada' });
    res.json({ mensagem: 'Unidade excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// ============================================
// VINCULAÇÃO DE PROCESSOS
// ============================================

async function listarProcessos(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const processos = await service.listarProcessos(id_empresa, req.params.id);
    res.json(processos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function listarProcessosDisponiveis(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const processos = await service.listarProcessosDisponiveis(id_empresa, req.params.id);
    res.json(processos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function vincularProcesso(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const { id_processo } = req.body;
    const resultado = await service.vincularProcesso(id_empresa, req.params.id, id_processo);
    if (!resultado) return res.status(404).json({ erro: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo vinculado com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function desvincularProcesso(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const resultado = await service.desvincularProcesso(id_empresa, req.params.id, req.params.idProcesso);
    if (!resultado) return res.status(404).json({ erro: 'Vínculo não encontrado' });
    res.json({ mensagem: 'Processo desvinculado com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

// ============================================
// VINCULAÇÃO DE USUÁRIOS
// ============================================

async function listarUsuarios(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const usuarios = await service.listarUsuarios(id_empresa, req.params.id);
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function listarUsuariosDisponiveis(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const usuarios = await service.listarUsuariosDisponiveis(id_empresa, req.params.id);
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function vincularUsuario(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const { id_usuario } = req.body;
    const resultado = await service.vincularUsuario(id_empresa, req.params.id, id_usuario);
    if (!resultado) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json({ mensagem: 'Usuário vinculado com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function desvincularUsuario(req, res) {
  try {
    const id_empresa = req.usuario.id_empresa;
    const resultado = await service.desvincularUsuario(id_empresa, req.params.id, req.params.idUsuario);
    if (!resultado) return res.status(404).json({ erro: 'Vínculo não encontrado' });
    res.json({ mensagem: 'Usuário desvinculado com sucesso' });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

module.exports = { 
  listar, 
  buscarPorId, 
  criar, 
  atualizar, 
  excluir,
  // Processos
  listarProcessos,
  listarProcessosDisponiveis,
  vincularProcesso,
  desvincularProcesso,
  // Usuários
  listarUsuarios,
  listarUsuariosDisponiveis,
  vincularUsuario,
  desvincularUsuario
};
