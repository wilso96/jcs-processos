const pool = require('../../config/db');

async function listarModelos(id_empresa) {
  const query = `
    select
      m.id,
      m.nome,
      m.descricao,
      m.tipo_tarefa,
      m.recorrencia_tipo,
      m.exige_foto,
      m.exige_observacao,
      m.ativo,
      a.id as id_area,
      a.nome as area
    from modelos_checklist m
    inner join areas a on a.id = m.id_area
    where m.id_empresa = $1
    order by m.nome
  `;

  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function buscarModeloPorId(id_empresa, id_modelo) {
  const queryModelo = `
    select
      m.id,
      m.nome,
      m.descricao,
      m.tipo_tarefa,
      m.recorrencia_tipo,
      m.exige_foto,
      m.exige_observacao,
      m.ativo,
      a.id as id_area,
      a.nome as area
    from modelos_checklist m
    inner join areas a on a.id = m.id_area
    where m.id_empresa = $1
      and m.id = $2
    limit 1
  `;

  const queryItens = `
    select
      id,
      ordem,
      descricao,
      tipo_resposta,
      obrigatorio,
      exige_evidencia,
      exige_observacao,
      valor_minimo,
      valor_maximo,
      opcoes_json,
      ativo
    from modelo_itens
    where id_empresa = $1
      and id_modelo = $2
    order by ordem
  `;

  const modeloResult = await pool.query(queryModelo, [id_empresa, id_modelo]);

  if (!modeloResult.rows.length) {
    throw new Error('Modelo não encontrado.');
  }

  const itensResult = await pool.query(queryItens, [id_empresa, id_modelo]);

  return {
    ...modeloResult.rows[0],
    itens: itensResult.rows
  };
}

async function criarModelo({
  id_empresa,
  id_area,
  nome,
  descricao,
  tipo_tarefa,
  recorrencia_tipo,
  exige_foto,
  exige_observacao,
  created_by
}) {
  const query = `
    insert into modelos_checklist (
      id_empresa,
      id_area,
      nome,
      descricao,
      tipo_tarefa,
      recorrencia_tipo,
      exige_foto,
      exige_observacao,
      ativo,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)
    returning
      id,
      id_area,
      nome,
      descricao,
      tipo_tarefa,
      recorrencia_tipo,
      exige_foto,
      exige_observacao,
      ativo
  `;

  const values = [
    id_empresa,
    id_area,
    nome,
    descricao || null,
    tipo_tarefa || 'CHECKLIST',
    recorrencia_tipo || 'MANUAL',
    exige_foto ?? false,
    exige_observacao ?? false,
    created_by || null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function criarItemModelo({
  id_empresa,
  id_modelo,
  ordem,
  descricao,
  tipo_resposta,
  obrigatorio,
  exige_evidencia,
  exige_observacao,
  valor_minimo,
  valor_maximo,
  opcoes_json
}) {
  const query = `
    insert into modelo_itens (
      id_empresa,
      id_modelo,
      ordem,
      descricao,
      tipo_resposta,
      obrigatorio,
      exige_evidencia,
      exige_observacao,
      valor_minimo,
      valor_maximo,
      opcoes_json,
      ativo
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
    returning
      id,
      id_modelo,
      ordem,
      descricao,
      tipo_resposta,
      obrigatorio,
      exige_evidencia,
      exige_observacao,
      valor_minimo,
      valor_maximo,
      opcoes_json,
      ativo
  `;

  const values = [
    id_empresa,
    id_modelo,
    ordem,
    descricao,
    tipo_resposta,
    obrigatorio ?? true,
    exige_evidencia ?? false,
    exige_observacao ?? false,
    valor_minimo ?? null,
    valor_maximo ?? null,
    opcoes_json ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  listarModelos,
  buscarModeloPorId,
  criarModelo,
  criarItemModelo
};