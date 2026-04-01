import NetInfo from '@react-native-community/netinfo';
import TarefaService from './TarefaService';
import {
  getSyncQueue,
  removeSyncQueueItem,
  incrementSyncAttempts,
  getSyncQueueCount,
  QueueItem,
} from '../database/SyncRepository';
import {
  getTarefasNaoSincronizadas,
  markTarefaAsSincronized,
  getItensNaoSincronizados,
  markItemAsSincronized,
  saveTarefas,
  saveItens,
} from '../database/TarefaRepository';
import { SyncStatus } from '../types';

type SyncCallback = (status: SyncStatus) => void;

class SyncServiceClass {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: SyncCallback[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initNetInfo();
  }

  private async initNetInfo() {
    // Escuta mudanças de conectividade
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (this.isOnline && !wasOnline) {
        // Voltou a ficar online - inicia sincronização
        this.syncPendingData();
      }

      this.notifyListeners();
    });

    // Verifica estado inicial
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  // Adiciona listener para mudanças de status
  addListener(callback: SyncCallback) {
    this.listeners.push(callback);
  }

  removeListener(callback: SyncCallback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners() {
    this.getStatus().then(status => {
      this.listeners.forEach(l => l(status));
    });
  }

  // Retorna status atual
  async getStatus(): Promise<SyncStatus> {
    const pendingCount = await getSyncQueueCount();
    return {
      isOnline: this.isOnline,
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncAt: null,
    };
  }

  // Inicia sincronização automática
  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingData();
      }
    }, intervalMs);
  }

  // Para sincronização automática
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sincroniza dados pendentes
  async syncPendingData(): Promise<boolean> {
    if (!this.isOnline || this.isSyncing) {
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      // 1. Sincroniza tarefas atualizadas
      await this.syncTarefas();

      // 2. Sincroniza itens de checklist
      await this.syncItens();

      // 3. Processa fila de sync
      await this.processSyncQueue();

      this.isSyncing = false;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.isSyncing = false;
      this.notifyListeners();
      return false;
    }
  }

  private async syncTarefas() {
    const tarefas = await getTarefasNaoSincronizadas();

    for (const tarefa of tarefas) {
      if (tarefa.status === 'concluida') {
        try {
          await TarefaService.atualizarStatus(tarefa.id, 'concluida');
          await markTarefaAsSincronized(tarefa.id);
        } catch (error) {
          console.error(`Erro ao sync tarefa ${tarefa.id}:`, error);
        }
      }
    }
  }

  private async syncItens() {
    const itens = await getItensNaoSincronizados();

    for (const item of itens) {
      if (item.resposta !== null) {
        try {
          await TarefaService.executarItem(item.tarefa_id, item.id_item_modelo, {
            resposta: item.resposta,
            observacao: item.observacao || undefined,
            foto_url: item.foto_url || undefined,
          });
          await markItemAsSincronized(item.id);
        } catch (error) {
          console.error(`Erro ao sync item ${item.id}:`, error);
        }
      }
    }
  }

  private async processSyncQueue() {
    const queue = await getSyncQueue();

    for (const item of queue) {
      try {
        const dados = JSON.parse(item.dados_json);

        switch (item.tabela) {
          case 'item_checklist':
            await TarefaService.executarItem(
              dados.tarefa_id,
              dados.id_item_modelo,
              dados
            );
            break;

          case 'tarefa_status':
            await TarefaService.atualizarStatus(
              dados.tarefa_id,
              dados.status,
              dados.observacao
            );
            break;
        }

        // Sucesso - remove da fila
        await removeSyncQueueItem(item.id);
      } catch (error) {
        // Falhou - incrementa tentativas
        await incrementSyncAttempts(item.id);
      }
    }
  }

  // Busca tarefas da API e salva localmente
  async fetchAndSaveTarefas(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await TarefaService.listarTarefas(1, 100);
      console.log('Resposta da API:', response);
      if (response && Array.isArray(response.tarefas)) {
        await saveTarefas(response.tarefas);
        console.log(`${response.tarefas.length} tarefas salvas localmente`);
      } else {
        console.warn('Resposta inválida da API:', response);
      }
      return true;
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return false;
    }
  }

  // Busca itens de uma tarefa da API e salva localmente
  async fetchAndSaveItens(tarefaId: number): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      const itens = await TarefaService.buscarItens(tarefaId);
      await saveItens(itens);
      return true;
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return false;
    }
  }
}

export const SyncService = new SyncServiceClass();
export default SyncService;
