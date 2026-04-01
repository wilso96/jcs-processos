/**
 * Service para Tarefas Recorrentes
 * Gerencia modelos de tarefas recorrentes e geração automática
 */

const pool = require('../../config/db');

/**
 * Listar modelos de tarefas recorrentes
 */
async function listar(id_empresa, filtros = {}) {
  let query = `
    select 
      tmr.id,
      tmr.titulo,
      tmr.descricao,
      tmr.ordem_execucao,
      tmr.tarefa_diaria,
      tmr.dias_semana,
      tmr.prioridade,
      tmr.hora_programada,
      tmr.ativo,
      tmr.criado_por,
      tmr.created_at,
      resp.nome as responsavel_nome,
      e.nome as equipe_nome,
      p.nome as processo_nome,
      p.id as processo_id,
      criador.nome as criador_nome
    from tarefas_modelo_recorrente tmr
    left join usuarios resp on resp.id = tmr.id_responsavel
    left join equipes e on e.id = tmr.id_equipe
    left join processos p on p.id = tmr.id_processo
    left join usuarios criador on criador.id = tmr.criado_por
    where tmr.id_empresa = $1
  `;
  
  const params = [id_empresa];
  
  if (filtros.ativo !== undefined) {
    params.push(filtros.ativo);
    query += ` and tmr.ativo = $${params.length}`;
  }
  
  if (filtros.id_responsavel) {
    params.push(filtros.id_responsavel);
    query += ` and tmr.id_responsavel = $${params.length}`;
  }
  
  if (filtros.id_processo) {
    params.push(filtros.id_processo);
    query += ` and tmr.id_processo = $${params.length}`;
  }
  
  query += ' order by p.nome, tmr.ordem_execucao';
  
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Buscar modelo por ID
 */
async function buscarPorId(id_empresa, id) {
  const query = `
    select 
      tmr.*,
      resp.nome as responsavel_nome,
      e.nome as equipe_nome,
      p.nome as processo_nome,
      p.id as processo_id,
      criador.nome as criador_nome
    from tarefas_modelo_recorrente tmr
    left join usuarios resp on resp.id = tmr.id_responsavel
    left join equipes e on e.id = tmr.id_equipe
    left join processos p on p.id = tmr.id_processo
    left join usuarios criador on criador.id = tmr.criado_por
    where tmr.id = $1 and tmr.id_empresa = $2
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

/**
 * Criar modelo de tarefa recorrente
 */
async function criar(dados) {
  const query = `
    insert into tarefas_modelo_recorrente (
      id_empresa,
      id_processo,
      id_responsavel,
      id_equipe,
      titulo,
      descricao,
      ordem_execucao,
      tarefa_diaria,
      dias_semana,
      prioridade,
      hora_programada,
      ativo,
      criado_por
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12)
    returning *
  `;
  
  const values = [
    dados.id_empresa,
    dados.id_processo || null,
    dados.id_responsavel || null,
    dados.id_equipe || null,
    dados.titulo,
    dados.descricao || null,
    dados.ordem_execucao || 0,
    dados.tarefa_diaria || false,
    dados.dias_semana || null,
    dados.prioridade || 'media',
    dados.hora_programada || null,
    dados.criado_por
  ];
  
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Atualizar modelo de tarefa recorrente
 */
async function atualizar(id_empresa, id, dados) {
  const campos = [];
  const values = [];
  let paramCount = 0;
  
  if (dados.titulo !== undefined) {
    paramCount++;
    campos.push(`titulo = $${paramCount}`);
    values.push(dados.titulo);
  }
  
  if (dados.descricao !== undefined) {
    paramCount++;
    campos.push(`descricao = $${paramCount}`);
    values.push(dados.descricao);
  }
  
  if (dados.ordem_execucao !== undefined) {
    paramCount++;
    campos.push(`ordem_execucao = $${paramCount}`);
    values.push(dados.ordem_execucao);
  }
  
  if (dados.tarefa_diaria !== undefined) {
    paramCount++;
    campos.push(`tarefa_diaria = $${paramCount}`);
    values.push(dados.tarefa_diaria);
  }
  
  if (dados.dias_semana !== undefined) {
    paramCount++;
    campos.push(`dias_semana = $${paramCount}`);
    values.push(dados.dias_semana);
  }
  
  if (dados.prioridade !== undefined) {
    paramCount++;
    campos.push(`prioridade = $${paramCount}`);
    values.push(dados.prioridade);
  }
  
  if (dados.hora_programada !== undefined) {
    paramCount++;
    campos.push(`hora_programada = $${paramCount}`);
    values.push(dados.hora_programada);
  }
  
  if (dados.id_responsavel !== undefined) {
    paramCount++;
    campos.push(`id_responsavel = $${paramCount}`);
    values.push(dados.id_responsavel);
  }
  
  if (dados.id_equipe !== undefined) {
    paramCount++;
    campos.push(`id_equipe = $${paramCount}`);
    values.push(dados.id_equipe);
  }
  
  if (dados.ativo !== undefined) {
    paramCount++;
    campos.push(`ativo = $${paramCount}`);
    values.push(dados.ativo);
  }
  
  if (campos.length === 0) {
    return null;
  }
  
  paramCount++;
  values.push(id);
  paramCount++;
  values.push(id_empresa);
  
  const query = `
    update tarefas_modelo_recorrente 
    set ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
    where id = $${paramCount - 1} and id_empresa = $${paramCount}
    returning *
  `;
  
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

/**
 * Desativar modelo de tarefa recorrente
 */
async function desativar(id_empresa, id) {
  const query = `
    update tarefas_modelo_recorrente 
    set ativo = false, updated_at = CURRENT_TIMESTAMP
    where id = $1 and id_empresa = $2
    returning *
  `;
  const { rows } = await pool.query(query, [id, id_empresa]);
  return rows[0] || null;
}

/**
 * Gerar tarefas do dia para todos os modelos ativos
 */
async function gerarTarefasDoDia(id_empresa) {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  
  // Buscar modelos ativos
  const modelosQuery = `
    select * from tarefas_modelo_recorrente 
    where id_empresa = $1 and ativo = true
  `;
  const { rows: modelos } = await pool.query(modelosQuery, [id_empresa]);
  
  const tarefasGeradas = [];
  
  for (const modelo of modelos) {
    // Verificar se deve gerar hoje
    const deveGerar = modelo.tarefa_diaria || 
                     (modelo.dias_semana && modelo.dias_semana.includes(diaSemana));
    
    if (!deveGerar) {
      continue;
    }
    
    // Verificar se já existe tarefa para hoje baseada neste modelo
    // (verifica por título, responsável e data)
    const existeQuery = `
      select id from tarefas 
      where id_empresa = $1 
        and id_responsavel = $2 
        and titulo = $3 
        and data_programada = $4
        and gerada_automaticamente = true
        and status != 'concluida'
      limit 1
    `;
    const dataHoje = hoje.toISOString().split('T')[0];
    const { rows: existentes } = await pool.query(existeQuery, [
      id_empresa, 
      modelo.id_responsavel, 
      modelo.titulo,
      dataHoje
    ]);
    
    if (existentes.length > 0) {
      // Já existe tarefa pendente para hoje
      continue;
    }
    
    // Criar nova tarefa baseada no modelo
    const criarTarefaQuery = `
      insert into tarefas (
        id_empresa,
        id_processo,
        id_responsavel,
        id_equipe,
        titulo,
        descricao,
        status,
        prioridade,
        data_programada,
        hora_programada,
        ordem_execucao,
        tarefa_diaria,
        dias_semana,
        tarefa_pai_id,
        gerada_automaticamente,
        criado_por
      ) values ($1, $2, $3, $4, $5, $6, 'pendente', $7, $8, $9, $10, $11, $12, $13, true, $14)
      returning *
    `;
    
    const { rows: tarefas } = await pool.query(criarTarefaQuery, [
      id_empresa,
      modelo.id_processo,
      modelo.id_responsavel,
      modelo.id_equipe,
      modelo.titulo,
      modelo.descricao,
      modelo.prioridade,
      dataHoje,
      modelo.hora_programada,
      modelo.ordem_execucao,
      modelo.tarefa_diaria,
      modelo.dias_semana,
      modelo.id,
      modelo.criado_por
    ]);
    
    if (tarefas.length > 0) {
      tarefasGeradas.push(tarefas[0]);
    }
  }
  
  return tarefasGeradas;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  desativar,
  gerarTarefasDoDia
};
