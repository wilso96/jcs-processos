const pool = require('../../config/db');
const { gerarHash } = require('../../utils/hash');

async function listar(id_empresa) {
  const query = `
    select 
      u.id,
      u.nome,
      u.login,
      u.email,
      u.telefone,
      u.ativo,
      p.nome as perfil
    from usuarios u
    inner join perfis p on p.id = u.id_perfil
    where u.id_empresa = $1
    order by u.nome
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function buscar(id, id_empresa) {
  const query = `
    select 
      u.id,
      u.nome,
      u.login,
      u.email,
      u.telefone,
      u.ativo,
      u.id_unidade,
      u.id_funcao,
      u.id_turno,
      u.id_perfil,
      p.nome as perfil
    from usuarios u
    inner join perfis p on p.id = u.id_perfil
    where u.id = $1 and u.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  if (!rows.length) throw new Error('Usuario nao encontrado');
  return rows[0];
}

async function criar(dados) {
  const senha_hash = await gerarHash(dados.senha);

  const query = `
    insert into usuarios (
      id_empresa, id_unidade, id_funcao, id_turno, id_perfil,
      nome, login, email, telefone, senha_hash, ativo
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
    returning id, nome, login, email
  `;

  const values = [
    dados.id_empresa,
    dados.id_unidade || null,
    dados.id_funcao || null,
    dados.id_turno || null,
    dados.id_perfil,
    dados.nome,
    dados.login,
    dados.email || null,
    dados.telefone || null,
    senha_hash
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function atualizar(id, dados, id_empresa) {
  const query = `
    update usuarios set
      nome = $1,
      email = $2,
      telefone = $3,
      ativo = $4,
      id_perfil = $5
    where id = $6 and id_empresa = $7
    returning id, nome, login, email
  `;
  const values = [
    dados.nome,
    dados.email || null,
    dados.telefone || null,
    dados.ativo !== false,
    dados.id_perfil,
    id,
    id_empresa
  ];
  const { rows } = await pool.query(query, values);
  if (!rows.length) throw new Error('Usuario nao encontrado');
  return rows[0];
}

async function excluir(id, id_empresa) {
  const query = 'delete from usuarios where id = $1 and id_empresa = $2';
  const result = await pool.query(query, [id, id_empresa]);
  if (!result.rowCount) throw new Error('Usuario nao encontrado');
}

module.exports = { listar, buscar, criar, atualizar, excluir };