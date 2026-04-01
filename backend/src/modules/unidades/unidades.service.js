const pool = require('../../config/db');

async function listar(id_empresa) {
  const query = `
    select 
      u.id,
      u.nome,
      u.endereco,
      u.ativo,
      u.responsavel_id,
      u.created_at,
      resp.nome as responsavel_nome,
      (select count(*) from processos p where p.id_unidade = u.id) as total_processos,
      (select count(*) from usuarios usr where usr.id_unidade = u.id) as total_usuarios
    from unidades u
    left join usuarios resp on resp.id = u.responsavel_id
    where u.id_empresa = $1
    order by u.nome
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const query = `
    select 
      u.id,
      u.nome,
      u.endereco,
      u.ativo,
      u.responsavel_id,
      resp.nome as responsavel_nome,
      u.created_at
    from unidades u
    left join usuarios resp on resp.id = u.responsavel_id
    where u.id = $1 and u.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

async function criar({ id_empresa, nome, endereco, responsavel_id }) {
  const query = `
    insert into unidades (id_empresa, nome, endereco, responsavel_id, ativo)
    values ($1, $2, $3, $4, true)
    returning id, nome, endereco, ativo
  `;
  const { rows } = await pool.query(query, [id_empresa, nome, endereco, responsavel_id]);
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const { nome, endereco, responsavel_id, ativo } = dados;
  const query = `
    update unidades 
    set nome = COALESCE($1, nome),
        endereco = COALESCE($2, endereco),
        responsavel_id = COALESCE($3, responsavel_id),
        ativo = COALESCE($4, ativo)
    where id = $5 and id_empresa = $6
    returning id, nome, endereco, ativo
  `;
  const { rows } = await pool.query(query, [nome, endereco, responsavel_id, ativo, id, id_empresa]);
  return rows[0];
}

async function excluir(id_empresa, id) {
  const query = `delete from unidades where id = $1 and id_empresa = $2 returning id`;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0];
}

// ============================================
// FUNÇÕES DE VINCULAÇÃO
// ============================================

// Listar processos vinculados à unidade
async function listarProcessos(id_empresa, id_unidade) {
  const query = `
    select 
      p.id,
      p.nome,
      p.descricao,
      p.status,
      p.data_inicio,
      p.data_fim,
      a.nome as area_nome,
      resp.nome as responsavel_nome,
      eq.nome as equipe_nome
    from processos p
    left join areas a on a.id = p.id_area
    left join usuarios resp on resp.id = p.responsavel_id
    left join equipes eq on eq.id = p.id_equipe
    where p.id_unidade = $1 and p.id_empresa = $2
    order by p.nome
  `;
  const { rows } = await pool.query(query, [id_unidade, id_empresa]);
  return rows;
}

// Listar processos disponíveis para vincular (que não estão vinculados a esta unidade)
async function listarProcessosDisponiveis(id_empresa, id_unidade) {
  const query = `
    select 
      p.id,
      p.nome,
      p.descricao,
      p.status,
      a.nome as area_nome
    from processos p
    left join areas a on a.id = p.id_area
    where p.id_empresa = $1 
      and (p.id_unidade IS NULL or p.id_unidade != $2)
      and p.status = 'ativo'
    order by p.nome
  `;
  const { rows } = await pool.query(query, [id_empresa, id_unidade]);
  return rows;
}

// Vincular processo à unidade
async function vincularProcesso(id_empresa, id_unidade, id_processo) {
  // Verificar se a unidade pertence à empresa
  const checkUnidade = await pool.query(
    'SELECT id FROM unidades WHERE id = $1 AND id_empresa = $2',
    [id_unidade, id_empresa]
  );
  if (!checkUnidade.rows.length) {
    throw new Error('Unidade não encontrada');
  }
  
  const query = `
    update processos 
    set id_unidade = $1
    where id = $2 and id_empresa = $3
    returning id, nome
  `;
  const { rows } = await pool.query(query, [id_unidade, id_processo, id_empresa]);
  return rows[0];
}

// Desvincular processo da unidade
async function desvincularProcesso(id_empresa, id_unidade, id_processo) {
  const query = `
    update processos 
    set id_unidade = NULL
    where id = $1 and id_unidade = $2 and id_empresa = $3
    returning id
  `;
  const { rows } = await pool.query(query, [id_processo, id_unidade, id_empresa]);
  return rows[0];
}

// Listar usuários vinculados à unidade
async function listarUsuarios(id_empresa, id_unidade) {
  const query = `
    select 
      u.id,
      u.nome,
      u.login,
      u.email,
      u.telefone,
      u.ativo,
      f.nome as funcao,
      p.nome as perfil
    from usuarios u
    left join funcoes f on f.id = u.id_funcao
    left join perfis p on p.id = u.id_perfil
    where u.id_unidade = $1 and u.id_empresa = $2
    order by u.nome
  `;
  const { rows } = await pool.query(query, [id_unidade, id_empresa]);
  return rows;
}

// Listar usuários disponíveis para vincular (que não estão vinculados a esta unidade)
async function listarUsuariosDisponiveis(id_empresa, id_unidade) {
  const query = `
    select 
      u.id,
      u.nome,
      u.login,
      u.email,
      u.ativo,
      f.nome as funcao
    from usuarios u
    left join funcoes f on f.id = u.id_funcao
    where u.id_empresa = $1 
      and (u.id_unidade IS NULL or u.id_unidade != $2)
      and u.ativo = true
    order by u.nome
  `;
  const { rows } = await pool.query(query, [id_empresa, id_unidade]);
  return rows;
}

// Vincular usuário à unidade
async function vincularUsuario(id_empresa, id_unidade, id_usuario) {
  // Verificar se a unidade pertence à empresa
  const checkUnidade = await pool.query(
    'SELECT id FROM unidades WHERE id = $1 AND id_empresa = $2',
    [id_unidade, id_empresa]
  );
  if (!checkUnidade.rows.length) {
    throw new Error('Unidade não encontrada');
  }
  
  const query = `
    update usuarios 
    set id_unidade = $1
    where id = $2 and id_empresa = $3
    returning id, nome
  `;
  const { rows } = await pool.query(query, [id_unidade, id_usuario, id_empresa]);
  return rows[0];
}

// Desvincular usuário da unidade
async function desvincularUsuario(id_empresa, id_unidade, id_usuario) {
  const query = `
    update usuarios 
    set id_unidade = NULL
    where id = $1 and id_unidade = $2 and id_empresa = $3
    returning id
  `;
  const { rows } = await pool.query(query, [id_usuario, id_unidade, id_empresa]);
  return rows[0];
}

module.exports = { 
  listar, 
  buscarPorId, 
  criar, 
  atualizar, 
  excluir,
  // Vínculos
  listarProcessos,
  listarProcessosDisponiveis,
  vincularProcesso,
  desvincularProcesso,
  listarUsuarios,
  listarUsuariosDisponiveis,
  vincularUsuario,
  desvincularUsuario
};
