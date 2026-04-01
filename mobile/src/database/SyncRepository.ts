import { getDatabase } from './Database';
import { SyncQueueItem } from '../types';

export interface QueueItem {
  tabela: 'tarefa' | 'item_checklist' | 'tarefa_status';
  acao: 'insert' | 'update';
  registro_id: number;
  dados: any;
}

export async function addToSyncQueue(item: QueueItem): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (tabela, acao, registro_id, dados_json, tentativas)
     VALUES (?, ?, ?, ?, 0)`,
    [item.tabela, item.acao, item.registro_id, JSON.stringify(item.dados)]
  );
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    'SELECT * FROM sync_queue ORDER BY id ASC LIMIT 50'
  );
  return results.map(r => ({
    ...r,
    dados_json: r.dados_json,
  }));
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue'
  );
  return result?.count || 0;
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function incrementSyncAttempts(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sync_queue SET tentativas = tentativas + 1 WHERE id = ?',
    [id]
  );
}

export async function removeFailedItems(maxAttempts: number = 5): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM sync_queue WHERE tentativas >= ?',
    [maxAttempts]
  );
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_queue');
}
