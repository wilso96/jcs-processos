const service = require('./modelos.service');

async function listar(req, res) {
  try {
    const dados = await service.listarModelos(req.usuario.id_empresa);
    return res.json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const dados = await service.buscarModeloPorId(
      req.usuario.id_empresa,
      req.params.id
    );
    return res.json(dados);
  } catch (error) {
    return res.status(404).json({ erro: error.message });
  }
}

async function criar(req, res) {
  try {
    const dados = await service.criarModelo({
      id_empresa: req.usuario.id_empresa,
      id_area: req.body.id_area,
      nome: req.body.nome,
      descricao: req.body.descricao,
      tipo_tarefa: req.body.tipo_tarefa,
      recorrencia_tipo: req.body.recorrencia_tipo,
      exige_foto: req.body.exige_foto,
      exige_observacao: req.body.exige_observacao,
      created_by: req.usuario.id_usuario
    });

    return res.status(201).json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function criarItem(req, res) {
  try {
    const dados = await service.criarItemModelo({
      id_empresa: req.usuario.id_empresa,
      id_modelo: req.params.id,
      ordem: req.body.ordem,
      descricao: req.body.descricao,
      tipo_resposta: req.body.tipo_resposta,
      obrigatorio: req.body.obrigatorio,
      exige_evidencia: req.body.exige_evidencia,
      exige_observacao: req.body.exige_observacao,
      valor_minimo: req.body.valor_minimo,
      valor_maximo: req.body.valor_maximo,
      opcoes_json: req.body.opcoes_json
    });

    return res.status(201).json(dados);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  criarItem
};