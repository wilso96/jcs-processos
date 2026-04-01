import { getDatabase } from './Database';
import { Tarefa, ItemChecklist } from '../types';

// ---------- TAREFAS ----------

export async function getAllTarefas(): Promise<Tarefa[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Tarefa>(
    'SELECT * FROM tarefas ORDER BY data_programada DESC, id DESC'
  );
  return results;
}

export async function getTarefasByStatus(status: string): Promise<Tarefa[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Tarefa>(
    'SELECT * FROM tarefas WHERE status = ? ORDER BY data_programada DESC',
    [status]
  );
  return results;
}

// Busca tarefas de um responsável específico, ordenando pendentes primeiro
export async function getTarefasByResponsavel(idResponsavel: number): Promise<Tarefa[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Tarefa>(
    `SELECT * FROM tarefas 
     WHERE id_responsavel = ?
     ORDER BY 
       CASE status 
         WHEN 'pendente' THEN 1 
         WHEN 'em_andamento' THEN 2 
         WHEN 'concluida' THEN 3 
       END,
       data_programada ASC,
       id DESC`,
    [idResponsavel]
  );
  return results;
}

export async function getTarefaById(id: number): Promise<Tarefa | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Tarefa>(
    'SELECT * FROM tarefas WHERE id = ?',
    [id]
  );
  return result || null;
}

export async function saveTarefa(tarefa: Tarefa): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO tarefas 
     (id, titulo, descricao, status, prioridade, data_programada, hora_programada, 
      id_responsavel, responsavel_nome, equipe_nome, modelo_nome, processo_nome, sincronizado, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tarefa.id,
      tarefa.titulo,
      tarefa.descricao,
      tarefa.status,
      tarefa.prioridade,
      tarefa.data_programada,
      tarefa.hora_programada,
      tarefa.id_responsavel,
      tarefa.responsavel_nome,
      tarefa.equipe_nome,
      tarefa.modelo_nome,
      tarefa.processo_nome,
      1, // sincronizado
      new Date().toISOString(),
    ]
  );
}

export async function saveTarefas(tarefas: Tarefa[]): Promise<void> {
  const db = await getDatabase();
  for (const tarefa of tarefas) {
    await saveTarefa(tarefa);
  }
}

export async function updateTarefaStatus(
  id: number,
  status: string,
  sincronizado: number = 0
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tarefas SET status = ?, sincronizado = ?, updated_at = ? WHERE id = ?',
    [status, sincronizado, new Date().toISOString(), id]
  );
}

export async function getTarefasNaoSincronizadas(): Promise<Tarefa[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Tarefa>(
    'SELECT * FROM tarefas WHERE sincronizado = 0'
  );
  return results;
}

export async function markTarefaAsSincronized(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tarefas SET sincronizado = 1 WHERE id = ?',
    [id]
  );
}

// ---------- ITENS CHECKLIST ----------

export async function getItensByTarefaId(tarefaId: number): Promise<ItemChecklist[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM itens_checklist WHERE tarefa_id = ? ORDER BY ordem',
    [tarefaId]
  );
  return results.map(r => ({
    ...r,
    opcoes: r.opcoes ? JSON.parse(r.opcoes) : null,
    obrigatorio: Boolean(r.obrigatorio),
    sincronizado: r.sincronizado ? 1 : 0,
  }));
}

export async function saveItens(itens: ItemChecklist[]): Promise<void> {
  const db = await getDatabase();
  for (const item of itens) {
    await db.runAsync(
      `INSERT OR REPLACE INTO itens_checklist 
       (id, id_item_modelo, tarefa_id, ordem, descricao, tipo_resposta, obrigatorio, 
        opcoes, resposta, observacao, foto_url, sincronizado, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.id_item_modelo,
        item.tarefa_id,
        item.ordem,
        item.descricao,
        item.tipo_resposta,
        item.obrigatorio ? 1 : 0,
        item.opcoes ? JSON.stringify(item.opcoes) : null,
        item.resposta,
        item.observacao,
        item.foto_url,
        1, // sincronizado
        new Date().toISOString(),
      ]
    );
  }
}

export async function updateItemResposta(
  id: number,
  resposta: string | null,
  observacao: string | null = null,
  sincronizado: number = 0
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE itens_checklist 
     SET resposta = ?, observacao = ?, sincronizado = ?, updated_at = ?
     WHERE id = ?`,
    [resposta, observacao, sincronizado, new Date().toISOString(), id]
  );
}

export async function getItensNaoSincronizados(): Promise<ItemChecklist[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM itens_checklist WHERE sincronizado = 0'
  );
  return results.map(r => ({
    ...r,
    opcoes: r.opcoes ? JSON.parse(r.opcoes) : null,
    obrigatorio: Boolean(r.obrigatorio),
  }));
}

export async function markItemAsSincronized(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE itens_checklist SET sincronizado = 1 WHERE id = ?',
    [id]
  );
}

// ---------- LIMPEZA ----------

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue');
  await db.runAsync('DELETE FROM itens_checklist');
  await db.runAsync('DELETE FROM tarefas');
  await db.runAsync('DELETE FROM usuarios');
}

export async function clearTarefasAntigas(dias: number = 30): Promise<void> {
  const db = await getDatabase();
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);
  
  await db.runAsync(
    'DELETE FROM tarefas WHERE data_programada < ? AND sincronizado = 1',
    [dataLimite.toISOString().split('T')[0]]
  );
}
