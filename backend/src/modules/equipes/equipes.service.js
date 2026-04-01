const pool = require('../../config/db');

async function listar(id_empresa) {
  const query = `
    select 
      e.id,
      e.nome,
      e.descricao,
      e.ativo,
      e.id_lider,
      u.nome as unidade_nome,
      l.nome as lider_nome,
      (select count(*) from equipe_usuarios eu where eu.id_equipe = e.id) as total_membros
    from equipes e
    left join unidades u on u.id = e.id_unidade
    left join usuarios l on l.id = e.id_lider
    where e.id_empresa = $1
    order by e.nome
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const query = `
    select 
      e.id,
      e.nome,
      e.descricao,
      e.ativo,
      e.id_lider,
      e.id_unidade,
      u.nome as unidade_nome,
      l.nome as lider_nome
    from equipes e
    left join unidades u on u.id = e.id_unidade
    left join usuarios l on l.id = e.id_lider
    where e.id = $1 and e.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

async function listarMembros(id_equipe) {
  const query = `
    select 
      u.id,
      u.nome,
      u.login,
      u.email,
      f.nome as funcao,
      eu.data_entrada
    from equipe_usuarios eu
    inner join usuarios u on u.id = eu.id_usuario
    left join funcoes f on f.id = u.id_funcao
    where eu.id_equipe = $1
    order by u.nome
  `;
  const { rows } = await pool.query(query, [id_equipe]);
  return rows;
}

async function criar({ id_empresa, nome, descricao, id_unidade, id_lider }) {
  const query = `
    insert into equipes (id_empresa, nome, descricao, id_unidade, id_lider, ativo)
    values ($1, $2, $3, $4, $5, true)
    returning id, nome, descricao, ativo
  `;
  const { rows } = await pool.query(query, [id_empresa, nome, descricao, id_unidade, id_lider]);
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const { nome, descricao, id_unidade, id_lider, ativo } = dados;
  const query = `
    update equipes 
    set nome = COALESCE($1, nome),
        descricao = COALESCE($2, descricao),
        id_unidade = COALESCE($3, id_unidade),
        id_lider = COALESCE($4, id_lider),
        ativo = COALESCE($5, ativo)
    where id = $6 and id_empresa = $7
    returning id, nome, descricao, ativo
  `;
  const { rows } = await pool.query(query, [nome, descricao, id_unidade, id_lider, ativo, id, id_empresa]);
  return rows[0];
}

async function adicionarMembro(id_equipe, id_usuario) {
  const query = `
    insert into equipe_usuarios (id_equipe, id_usuario)
    values ($1, $2)
    on conflict do nothing
    returning id
  `;
  const { rows } = await pool.query(query, [id_equipe, id_usuario]);
  return rows[0];
}

async function removerMembro(id_equipe, id_usuario) {
  const query = `delete from equipe_usuarios where id_equipe = $1 and id_usuario = $2 returning id`;
  const { rows } = await pool.query(query, [id_equipe, id_usuario]);
  return rows[0];
}

async function excluir(id_empresa, id) {
  const { rows } = await pool.query(
    `delete from equipes where id = $1 and id_empresa = $2 returning id`,
    [id, id_empresa]
  );
  return rows[0];
}

module.exports = { 
  listar, buscarPorId, listarMembros, criar, atualizar, 
  adicionarMembro, removerMembro, excluir 
};
