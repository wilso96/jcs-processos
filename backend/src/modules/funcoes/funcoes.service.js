const pool = require('../../config/db');

async function listar(id_empresa) {
  const { rows } = await pool.query(
    `select id, nome, descricao, nivel_hierarquico, ativo 
     from funcoes where id_empresa = $1 order by nivel_hierarquico, nome`,
    [id_empresa]
  );
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const { rows } = await pool.query(
    `select id, nome, descricao, nivel_hierarquico, ativo 
     from funcoes where id = $1 and id_empresa = $2`,
    [id, id_empresa]
  );
  return rows[0] || null;
}

async function criar({ id_empresa, nome, descricao, nivel_hierarquico }) {
  const { rows } = await pool.query(
    `insert into funcoes (id_empresa, nome, descricao, nivel_hierarquico, ativo)
     values ($1, $2, $3, $4, true)
     returning id, nome, descricao, nivel_hierarquico, ativo`,
    [id_empresa, nome, descricao, nivel_hierarquico || 1]
  );
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const { nome, descricao, nivel_hierarquico, ativo } = dados;
  const { rows } = await pool.query(
    `update funcoes 
     set nome = COALESCE($1, nome),
         descricao = COALESCE($2, descricao),
         nivel_hierarquico = COALESCE($3, nivel_hierarquico),
         ativo = COALESCE($4, ativo)
     where id = $5 and id_empresa = $6
     returning id, nome, descricao, nivel_hierarquico, ativo`,
    [nome, descricao, nivel_hierarquico, ativo, id, id_empresa]
  );
  return rows[0];
}

async function excluir(id_empresa, id) {
  const { rows } = await pool.query(
    `delete from funcoes where id = $1 and id_empresa = $2 returning id`,
    [id, id_empresa]
  );
  return rows[0];
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
