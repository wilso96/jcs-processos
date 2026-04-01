const pool = require('../../config/db');

async function listar(id_empresa) {
  const { rows } = await pool.query(
    `select id, nome, hora_inicio, hora_fim, ativo 
     from turnos where id_empresa = $1 order by hora_inicio`,
    [id_empresa]
  );
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const { rows } = await pool.query(
    `select id, nome, hora_inicio, hora_fim, ativo 
     from turnos where id = $1 and id_empresa = $2`,
    [id, id_empresa]
  );
  return rows[0] || null;
}

async function criar({ id_empresa, nome, hora_inicio, hora_fim }) {
  const { rows } = await pool.query(
    `insert into turnos (id_empresa, nome, hora_inicio, hora_fim, ativo)
     values ($1, $2, $3, $4, true)
     returning id, nome, hora_inicio, hora_fim, ativo`,
    [id_empresa, nome, hora_inicio, hora_fim]
  );
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const { nome, hora_inicio, hora_fim, ativo } = dados;
  const { rows } = await pool.query(
    `update turnos 
     set nome = COALESCE($1, nome),
         hora_inicio = COALESCE($2, hora_inicio),
         hora_fim = COALESCE($3, hora_fim),
         ativo = COALESCE($4, ativo)
     where id = $5 and id_empresa = $6
     returning id, nome, hora_inicio, hora_fim, ativo`,
    [nome, hora_inicio, hora_fim, ativo, id, id_empresa]
  );
  return rows[0];
}

async function excluir(id_empresa, id) {
  const { rows } = await pool.query(
    `delete from turnos where id = $1 and id_empresa = $2 returning id`,
    [id, id_empresa]
  );
  return rows[0];
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
