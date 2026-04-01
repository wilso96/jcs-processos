import { Platform } from 'react-native';
import { SCHEMA } from './schema';

const DB_NAME = 'jcs_colaborador.db';

let db: any = null;
let SQLite: any = null;

// Detecta se está rodando na web
const isWeb = Platform.OS === 'web';

// Armazenamento web
let webData: {
  tarefas: any[];
  itens: any[];
  syncQueue: any[];
} = {
  tarefas: [],
  itens: [],
  syncQueue: []
};

function loadWebData() {
  try {
    const tarefas = localStorage.getItem('jcs_tarefas');
    const itens = localStorage.getItem('jcs_itens');
    const syncQueue = localStorage.getItem('jcs_sync_queue');
    webData.tarefas = tarefas ? JSON.parse(tarefas) : [];
    webData.itens = itens ? JSON.parse(itens) : [];
    webData.syncQueue = syncQueue ? JSON.parse(syncQueue) : [];
  } catch (e) {
    console.error('Erro ao carregar dados web:', e);
    webData = { tarefas: [], itens: [], syncQueue: [] };
  }
}

function saveWebData() {
  try {
    localStorage.setItem('jcs_tarefas', JSON.stringify(webData.tarefas));
    localStorage.setItem('jcs_itens', JSON.stringify(webData.itens));
    localStorage.setItem('jcs_sync_queue', JSON.stringify(webData.syncQueue));
  } catch (e) {
    console.error('Erro ao salvar dados web:', e);
  }
}

export async function getDatabase(): Promise<any> {
  // Na web, retorna um mock que usa localStorage
  if (isWeb) {
    loadWebData();
    return getWebDatabase();
  }

  // No nativo, carrega SQLite dinamicamente
  if (!db) {
    if (!SQLite) {
      SQLite = await import('expo-sqlite');
    }
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase();
  }
  return db;
}

// Mock de banco para web usando localStorage
function getWebDatabase() {
  return {
    getAllAsync: async (query: string, params?: any[]): Promise<any[]> => {
      loadWebData();
      if (query.includes('FROM tarefas') || query.includes('tarefas.')) {
        return webData.tarefas;
      }
      if (query.includes('FROM itens_checklist') || query.includes('itens.')) {
        return webData.itens;
      }
      if (query.includes('FROM sync_queue')) {
        return webData.syncQueue;
      }
      return [];
    },
    getFirstAsync: async (query: string, params?: any[]): Promise<any | null> => {
      loadWebData();
      if (query.includes('FROM tarefas') || query.includes('tarefas.')) {
        return webData.tarefas.length > 0 ? webData.tarefas[0] : null;
      }
      if (query.includes('FROM itens_checklist') || query.includes('itens.')) {
        return webData.itens.length > 0 ? webData.itens[0] : null;
      }
      return null;
    },
    runAsync: async (query: string, params?: any[]): Promise<any> => {
      console.log('Web DB:', query, params);
      loadWebData();
      
      if (query.includes('INSERT INTO tarefas')) {
        const tarefa = params[0];
        tarefa.id = Date.now();
        webData.tarefas.push(tarefa);
        saveWebData();
        return { insertId: tarefa.id, rowsAffected: 1 };
      }
      
      if (query.includes('INSERT INTO itens_checklist')) {
        const item = params[0];
        item.id = Date.now();
        webData.itens.push(item);
        saveWebData();
        return { insertId: item.id, rowsAffected: 1 };
      }
      
      if (query.includes('UPDATE tarefas')) {
        const [fields, whereClause] = query.split('WHERE');
        const tarefaIndex = webData.tarefas.findIndex(t => t.id === params[params.length - 1]);
        if (tarefaIndex >= 0) {
          const updateFields = fields.replace('UPDATE tarefas SET', '').split(',');
          updateFields.forEach((field: string, i: number) => {
            const fieldName = field.split('=')[0].trim();
            webData.tarefas[tarefaIndex][fieldName] = params[i];
          });
          saveWebData();
          return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
      }
      
      if (query.includes('UPDATE itens_checklist')) {
        const itemIndex = webData.itens.findIndex(i => i.id === params[params.length - 1]);
        if (itemIndex >= 0) {
          webData.itens[itemIndex].concluido = params[0];
          webData.itens[itemIndex].data_execucao = params[1];
          webData.itens[itemIndex].sincronizado = params[2];
          saveWebData();
          return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
      }
      
      if (query.includes('INSERT INTO sync_queue')) {
        webData.syncQueue.push({ id: Date.now(), ...params[0] });
        saveWebData();
        return { insertId: Date.now(), rowsAffected: 1 };
      }
      
      if (query.includes('DELETE FROM sync_queue')) {
        webData.syncQueue = [];
        saveWebData();
        return { rowsAffected: 1 };
      }
      
      return { rowsAffected: 0 };
    },
    execAsync: async (sql: string): Promise<void> => {
      // No-op na web
    },
    closeAsync: async (): Promise<void> => {
      // No-op na web
    },
  };
}

async function initializeDatabase(): Promise<void> {
  if (!db || isWeb) return;

  const statements = SCHEMA.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await db.execAsync(statement);
    } catch (error) {
      console.error('Error executing SQL:', statement, error);
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (db && !isWeb) {
    await db.closeAsync();
    db = null;
  }
}

export default { getDatabase, closeDatabase };
