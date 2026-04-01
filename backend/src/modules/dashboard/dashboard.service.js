const pool = require('../../config/db');

async function estatisticasGerais(id_empresa) {
  const query = `
    select 
      -- Tarefas
      (select count(*) from tarefas where id_empresa = $1) as total_tarefas,
      (select count(*) from tarefas where id_empresa = $1 and status = 'pendente') as tarefas_pendentes,
      (select count(*) from tarefas where id_empresa = $1 and status = 'em_andamento') as tarefas_andamento,
      (select count(*) from tarefas where id_empresa = $1 and status = 'concluida') as tarefas_concluidas,
      (select count(*) from tarefas where id_empresa = $1 and prazo_limite < now() and status not in ('concluida', 'cancelada')) as tarefas_atrasadas,
      
      -- Tarefas do dia
      (select count(*) from tarefas where id_empresa = $1 and date(data_programada) = current_date) as tarefas_hoje,
      (select count(*) from tarefas where id_empresa = $1 and date(data_programada) = current_date + 1) as tarefas_amanha,
      
      -- Usuários
      (select count(*) from usuarios where id_empresa = $1 and ativo = true) as total_usuarios,
      
      -- Equipes
      (select count(*) from equipes where id_empresa = $1 and ativo = true) as total_equipes,
      
      -- Processos
      (select count(*) from processos where id_empresa = $1 and status = 'ativo') as processos_ativos
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows[0];
}

async function tarefasPorStatus(id_empresa) {
  const query = `
    select 
      status,
      count(*) as total
    from tarefas
    where id_empresa = $1
    group by status
    order by total desc
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function tarefasPorPrioridade(id_empresa) {
  const query = `
    select 
      prioridade,
      count(*) as total
    from tarefas
    where id_empresa = $1
    group by prioridade
    order by 
      case prioridade 
        when 'urgente' then 1 
        when 'alta' then 2 
        when 'media' then 3 
        when 'baixa' then 4 
      end
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function tarefasPorArea(id_empresa) {
  const query = `
    select 
      a.nome as area,
      count(t.id) as total,
      count(t.id) filter (where t.status = 'concluida') as concluidas
    from areas a
    left join tarefas t on t.id_area = a.id and t.id_empresa = $1
    where a.id_empresa = $1 and a.ativo = true
    group by a.id, a.nome
    order by total desc
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function tarefasPorResponsavel(id_empresa) {
  const query = `
    select 
      u.id,
      u.nome,
      count(t.id) as total_tarefas,
      count(t.id) filter (where t.status = 'concluida') as tarefas_concluidas,
      count(t.id) filter (where t.status = 'pendente') as tarefas_pendentes,
      count(t.id) filter (where t.prazo_limite < now() and t.status not in ('concluida', 'cancelada')) as tarefas_atrasadas
    from usuarios u
    left join tarefas t on t.id_responsavel = u.id and t.id_empresa = $1
    where u.id_empresa = $1 and u.ativo = true
    group by u.id, u.nome
    order by total_tarefas desc
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function tarefasRecentes(id_empresa, limite = 10) {
  const query = `
    select 
      t.id,
      t.titulo,
      t.status,
      t.prioridade,
      t.data_programada,
      t.prazo_limite,
      resp.nome as responsavel,
      a.nome as area
    from tarefas t
    left join usuarios resp on resp.id = t.id_responsavel
    left join areas a on a.id = t.id_area
    where t.id_empresa = $1
    order by t.created_at desc
    limit $2
  `;
  const { rows } = await pool.query(query, [id_empresa, limite]);
  return rows;
}

async function tarefasAtrasadas(id_empresa) {
  const query = `
    select 
      t.id,
      t.titulo,
      t.status,
      t.prioridade,
      t.data_programada,
      t.prazo_limite,
      resp.nome as responsavel,
      e.nome as equipe,
      now() - t.prazo_limite as tempo_atraso
    from tarefas t
    left join usuarios resp on resp.id = t.id_responsavel
    left join equipes e on e.id = t.id_equipe
    where t.id_empresa = $1 
      and t.prazo_limite < now() 
      and t.status not in ('concluida', 'cancelada')
    order by t.prazo_limite asc
  `;
  const { rows } = await pool.query(query, [id_empresa]);
  return rows;
}

async function produtividadeDiaria(id_empresa, dias = 7) {
  const query = `
    select 
      date(data_execucao) as data,
      count(*) as total_concluidas,
      avg(extract(epoch from (data_execucao - created_at)) / 60) as tempo_medio_minutos
    from tarefas
    where id_empresa = $1 
      and status = 'concluida'
      and data_execucao >= current_date - interval '1 day' * $2
    group by date(data_execucao)
    order by data desc
  `;
  const { rows } = await pool.query(query, [id_empresa, dias]);
  return rows;
}

module.exports = {
  estatisticasGerais,
  tarefasPorStatus,
  tarefasPorPrioridade,
  tarefasPorArea,
  tarefasPorResponsavel,
  tarefasRecentes,
  tarefasAtrasadas,
  produtividadeDiaria
};
