const service = require('./dashboard.service');

async function estatisticasGerais(req, res) {
  try {
    const stats = await service.estatisticasGerais(req.usuario.id_empresa);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasPorStatus(req, res) {
  try {
    const dados = await service.tarefasPorStatus(req.usuario.id_empresa);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasPorPrioridade(req, res) {
  try {
    const dados = await service.tarefasPorPrioridade(req.usuario.id_empresa);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasPorArea(req, res) {
  try {
    const dados = await service.tarefasPorArea(req.usuario.id_empresa);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasPorResponsavel(req, res) {
  try {
    const dados = await service.tarefasPorResponsavel(req.usuario.id_empresa);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasRecentes(req, res) {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const dados = await service.tarefasRecentes(req.usuario.id_empresa, limite);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function tarefasAtrasadas(req, res) {
  try {
    const dados = await service.tarefasAtrasadas(req.usuario.id_empresa);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

async function produtividadeDiaria(req, res) {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const dados = await service.produtividadeDiaria(req.usuario.id_empresa, dias);
    res.json(dados);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = {
  estatisticasGerais,
  tarefasPorStatus,
  tarefasPorPrioridade,
  tarefasPorArea,
  tarefasPorResponsavel,
  tarefasRecentes,
  tarefasAtrasadas,
  produtividadeDiaria
};
