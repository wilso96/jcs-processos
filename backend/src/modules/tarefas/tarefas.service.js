const pool = require('../../config/db');

async function listar(id_empresa, filtros = {}, id_usuario = null) {
  let query = `
    select 
      t.id,
      t.titulo,
      t.descricao,
      t.status,
      t.prioridade,
      t.data_programada,
      t.hora_programada,
      t.data_execucao,
      t.prazo_limite,
      t.observacao_geral,
      t.criado_por,
      t.created_at,
      t.updated_at,
      t.ordem_execucao,
      t.tarefa_diaria,
      t.dias_semana,
      t.gerada_automaticamente,
      t.id_responsavel,
      resp.nome as responsavel_nome,
      e.nome as equipe_nome,
      m.nome as modelo_nome,
      p.nome as processo_nome,
      p.id as processo_id
    from tarefas t
    left join usuarios resp on resp.id = t.id_responsavel
    left join equipes e on e.id = t.id_equipe
    left join modelos_checklist m on m.id = t.id_modelo
    left join processos p on p.id = t.id_processo
    where t.id_empresa = $1
  `;
  
  const params = [id_empresa];
  
  // Se não for admin/supervisor, mostra só as tarefas do próprio usuário
  if (id_usuario && !filtros.supervisor) {
    params.push(id_usuario);
    query += ` and t.id_responsavel = $${params.length}`;
  }
  
  if (filtros.status) {
    params.push(filtros.status);
    query += ` and t.status = $${params.length}`;
  }
  
  if (filtros.prioridade) {
    params.push(filtros.prioridade);
    query += ` and t.prioridade = $${params.length}`;
  }
  
  if (filtros.id_responsavel) {
    params.push(filtros.id_responsavel);
    query += ` and t.id_responsavel = $${params.length}`;
  }
  
  if (filtros.id_equipe) {
    params.push(filtros.id_equipe);
    query += ` and t.id_equipe = $${params.length}`;
  }
  
   if (filtros.data_de) {
    params.push(filtros.data_de);
    query += ` and t.data_programada >= $${params.length}`;
  }
  
  if (filtros.data_ate) {
    params.push(filtros.data_ate);
    query += ` and t.data_programada <= $${params.length}`;
  }
  
  // Contar total antes da paginação
  const countQuery = query.replace(/select[\s\S]*?from/, 'select count(*) as total from');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || 0);
  
  // Ordenar por: processo, depois ordem_execucao, depois prioridade
  query += ' order by p.nome, t.ordem_execucao, t.prioridade desc, t.data_programada';
  
  // Adicionar paginação
  const limit = parseInt(filtros.limit) || 20;
  const page = parseInt(filtros.page) || 1;
  const offset = (page - 1) * limit;
  
  params.push(limit);
  query += ` limit $${params.length}`;
  
  params.push(offset);
  query += ` offset $${params.length}`;
  
  const { rows } = await pool.query(query, params);
  
  return {
    tarefas: rows,
    total: total,
    page: page,
    limit: limit,
    totalPages: Math.ceil(total / limit)
  };
}

async function buscarPorId(id_empresa, id) {
  const query = `
    select 
      t.*,
      resp.nome as responsavel_nome,
      resp.login as responsavel_login,
      e.nome as equipe_nome,
      m.nome as modelo_nome,
      m.exige_foto,
      m.exige_observacao,
      a.nome as area_nome,
      u.nome as unidade_nome,
      criador.nome as criador_nome
    from tarefas t
    left join usuarios resp on resp.id = t.id_responsavel
    left join equipes e on e.id = t.id_equipe
    left join modelos_checklist m on m.id = t.id_modelo
    left join areas a on a.id = t.id_area
    left join unidades u on u.id = t.id_unidade
    left join usuarios criador on criador.id = t.criado_por
    where t.id = $1 and t.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

async function buscarItensExecucao(id_tarefa) {
  const query = `
    select 
      ie.id,
      ie.ordem,
      ie.descricao,
      ie.tipo_resposta,
      ie.obrigatorio,
      ie.opcoes,
      te.resposta,
      te.observacao,
      te.foto_url,
      te.executado_por,
      te.executado_em
    from itens_modelo ie
    left join tarefa_itens_execucao te on te.id_item_modelo = ie.id and te.id_tarefa = $1
    where ie.id_modelo = (select id_modelo from tarefas where id = $1)
    order by ie.ordem
  `;
  const { rows } = await pool.query(query, [id_tarefa]);
  return rows;
}

async function criar({ id_empresa, criado_por, id_processo, id_modelo, id_responsavel, id_equipe, titulo, descricao, prioridade, data_programada, hora_programada, prazo_limite, ordem_execucao, tarefa_diaria, dias_semana }) {
  const query = `
    insert into tarefas (id_empresa, criado_por, id_processo, id_modelo, id_responsavel, id_equipe, titulo, descricao, prioridade, data_programada, hora_programada, prazo_limite, ordem_execucao, tarefa_diaria, dias_semana, status)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pendente')
    returning *
  `;
  const { rows } = await pool.query(query, [
    id_empresa, criado_por, id_processo, id_modelo, id_responsavel, id_equipe, 
    titulo, descricao, prioridade || 'media', data_programada, hora_programada, 
    prazo_limite, ordem_execucao || 0, tarefa_diaria || false, dias_semana
  ]);
  return rows[0];
}

async function atualizar(id_empresa, id, dados) {
  const campos = [];
  const valores = [];
  let idx = 1;
  
  const camposPermitidos = [
    'titulo', 'descricao', 'status', 'prioridade', 'id_responsavel', 'id_equipe', 
    'data_programada', 'hora_programada', 'prazo_limite', 'observacao_geral', 
    'latitude_execucao', 'longitude_execucao', 'ordem_execucao', 'tarefa_diaria', 'dias_semana'
  ];
  
  for (const campo of camposPermitidos) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = $${idx}`);
      valores.push(dados[campo]);
      idx++;
    }
  }
  
  if (campos.length === 0) return null;
  
  // Atualiza timestamp
  campos.push(`updated_at = CURRENT_TIMESTAMP`);
  
  // Se está concluindo, marca data_execucao
  if (dados.status === 'concluida') {
    campos.push(`data_execucao = CURRENT_TIMESTAMP`);
  }
  
  valores.push(id, id_empresa);
  const query = `
    update tarefas 
    set ${campos.join(', ')}
    where id = $${idx} and id_empresa = $${idx + 1}
    returning *
  `;
  
  const { rows } = await pool.query(query, valores);
  return rows[0];
}

async function executarItem(id_tarefa, id_item_modelo, { resposta, observacao, foto_url }, executado_por) {
  const query = `
    insert into tarefa_itens_execucao (id_tarefa, id_item_modelo, resposta, observacao, foto_url, executado_por)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (id_tarefa, id_item_modelo) 
    do update set resposta = $3, observacao = $4, foto_url = $5, executado_por = $6, executado_em = CURRENT_TIMESTAMP
    returning *
  `;
  const { rows } = await pool.query(query, [id_tarefa, id_item_modelo, resposta, observacao, foto_url, executado_por]);
  return rows[0];
}

async function adicionarComentario(id_tarefa, id_usuario, comentario) {
  const query = `
    insert into tarefa_comentarios (id_tarefa, id_usuario, comentario)
    values ($1, $2, $3)
    returning *
  `;
  const { rows } = await pool.query(query, [id_tarefa, id_usuario, comentario]);
  return rows[0];
}

async function listarComentarios(id_tarefa) {
  const query = `
    select 
      tc.*,
      u.nome as usuario_nome,
      u.login as usuario_login
    from tarefa_comentarios tc
    inner join usuarios u on u.id = tc.id_usuario
    where tc.id_tarefa = $1
    order by tc.created_at asc
  `;
  const { rows } = await pool.query(query, [id_tarefa]);
  return rows;
}

async function listarHistorico(id_tarefa) {
  const query = `
    select 
      th.*,
      u.nome as usuario_nome
    from tarefa_historico th
    inner join usuarios u on u.id = th.id_usuario
    where th.id_tarefa = $1
    order by th.alterado_em desc
  `;
  const { rows } = await pool.query(query, [id_tarefa]);
  return rows;
}

async function excluir(id_empresa, id) {
  const { rows } = await pool.query(
    `delete from tarefas where id = $1 and id_empresa = $2 returning id`,
    [id, id_empresa]
  );
  return rows[0];
}

// Estatísticas para dashboard
async function estatisticas(id_empresa) {
  const query = `
    select 
      count(*) filter (where status = 'pendente') as pendentes,
      count(*) filter (where status = 'em_andamento') as em_andamento,
      count(*) filter (where status = 'concluida') as concluidas,
      count(*) filter (where status = 'atrasada') as atrasadas,
      count(*) filter (where prazo_limite < now() and status not in ('concluida', 'cancelada')) as overdue,
      count(*) filter (where date(data_programada) = current_date) as hoje,
      count(*) filter (where date(data_programada) = current_date + 1) as amanha,
      count(*) filter (where date(data_programada) between current_date + 2 and current_date + 7) as proxima_semana
    from tarefas
    where id_empresa = $1
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows[0];
}

module.exports = { 
  listar, buscarPorId, buscarItensExecucao, criar, atualizar, 
  executarItem, adicionarComentario, listarComentarios, listarHistorico, 
  excluir, estatisticas 
};
