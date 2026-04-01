const pool = require('../../config/db');

async function listar(id_empresa) {
  const query = `
    select id, nome, descricao, ativo, created_at
    from areas
    where id_empresa = $1
    order by nome
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const query = `
    select id, nome, descricao, ativo, created_at
    from areas
    where id = $1 and id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

async function criar({ id_empresa, nome, descricao }) {
  const query = `
    insert into areas (id_empresa, nome, descricao, ativo)
    values ($1, $2, $3, true)
    returning id, nome, descricao, ativo
  `;
  const { rows } = await pool.query(query, [id_empresa, nome, descricao || null]);
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const { nome, descricao, ativo } = dados;
  const query = `
    update areas 
    set nome = COALESCE($1, nome),
        descricao = COALESCE($2, descricao),
        ativo = COALESCE($3, ativo)
    where id = $4 and id_empresa = $5
    returning id, nome, descricao, ativo
  `;
  const { rows } = await pool.query(query, [nome, descricao, ativo, id, id_empresa]);
  return rows[0];
}

async function excluir(id_empresa, id) {
  const query = `delete from areas where id = $1 and id_empresa = $2 returning id`;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0];
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };