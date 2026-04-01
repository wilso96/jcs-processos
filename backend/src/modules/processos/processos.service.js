const pool = require('../../config/db');

async function listar(id_empresa, filtros = {}) {
  let query = `
    select 
      p.id,
      p.nome,
      p.descricao,
      p.status,
      p.data_inicio,
      p.data_fim,
      p.created_at,
      p.id_equipe,
      m.nome as modelo_nome,
      a.nome as area_nome,
      u.nome as unidade_nome,
      resp.nome as responsavel_nome,
      eq.nome as equipe_nome
    from processos p
    left join modelos_checklist m on m.id = p.id_modelo
    left join areas a on a.id = p.id_area
    left join unidades u on u.id = p.id_unidade
    left join usuarios resp on resp.id = p.responsavel_id
    left join equipes eq on eq.id = p.id_equipe
    where p.id_empresa = $1
  `;
  
  const params = [id_empresa];
  
  if (filtros.status) {
    params.push(filtros.status);
    query += ` and p.status = $${params.length}`;
  }
  
  if (filtros.id_area) {
    params.push(filtros.id_area);
    query += ` and p.id_area = $${params.length}`;
  }
  
  if (filtros.id_unidade) {
    params.push(filtros.id_unidade);
    query += ` and p.id_unidade = $${params.length}`;
  }
  
  if (filtros.id_equipe) {
    params.push(filtros.id_equipe);
    query += ` and p.id_equipe = $${params.length}`;
  }
  
  query += ' order by p.created_at desc';
  
  const { rows } = await pool.query(query, params);
  return rows;
}

async function buscarPorId(id_empresa, id) {
  const query = `
    select 
      p.*,
      m.nome as modelo_nome,
      m.tipo_tarefa,
      a.nome as area_nome,
      u.nome as unidade_nome,
      resp.nome as responsavel_nome,
      eq.nome as equipe_nome
    from processos p
    left join modelos_checklist m on m.id = p.id_modelo
    left join areas a on a.id = p.id_area
    left join unidades u on u.id = p.id_unidade
    left join usuarios resp on resp.id = p.responsavel_id
    left join equipes eq on eq.id = p.id_equipe
    where p.id = $1 and p.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

async function criar({ id_empresa, id_modelo, id_area, id_unidade, id_equipe, nome, descricao, responsavel_id, data_inicio, data_fim }) {
  const query = `
    insert into processos (id_empresa, id_modelo, id_area, id_unidade, id_equipe, nome, descricao, responsavel_id, data_inicio, data_fim, status)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ativo')
    returning *
  `;
  const { rows } = await pool.query(query, [id_empresa, id_modelo, id_area, id_unidade, id_equipe, nome, descricao, responsavel_id, data_inicio, data_fim]);
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const campos = [];
  const valores = [];
  let idx = 1;
  
  const camposPermitidos = ['nome', 'descricao', 'status', 'data_inicio', 'data_fim', 'responsavel_id', 'id_equipe'];
  
  for (const campo of camposPermitidos) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = $${idx}`);
      valores.push(dados[campo]);
      idx++;
    }
  }
  
  if (campos.length === 0) return null;
  
  valores.push(id, id_empresa);
  const query = `
    update processos 
    set ${campos.join(', ')}
    where id = $${idx} and id_empresa = $${idx + 1}
    returning *
  `;
  
  const { rows } = await pool.query(query, valores);
  return rows[0];
}

async function excluir(id_empresa, id) {
  const { rows } = await pool.query(
    `delete from processos where id = $1 and id_empresa = $2 returning id`,
    [id, id_empresa]
  );
  return rows[0];
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
