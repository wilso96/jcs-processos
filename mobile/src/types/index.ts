// Tipos do App JCS Colaborador

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil: string;
  id_empresa: number;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  status: 'pendente' | 'concluida' | 'em_andamento';
  prioridade: 'alta' | 'media' | 'baixa';
  data_programada: string;
  hora_programada: string | null;
  id_responsavel: number | null;
  responsavel_nome: string | null;
  equipe_nome: string | null;
  modelo_nome: string | null;
  processo_nome: string | null;
  // Campos locais para sync
  sincronizado?: number;
  updated_at?: string;
}

export interface ItemChecklist {
  id: number;
  id_item_modelo: number;
  tarefa_id: number;
  ordem: number;
  descricao: string;
  tipo_resposta: 'sim_nao' | 'texto' | 'opcoes';
  obrigatorio: boolean;
  opcoes: string[] | null;
  resposta: string | null;
  observacao: string | null;
  foto_url: string | null;
  sincronizado?: number;
}

export interface SyncQueueItem {
  id: number;
  tabela: 'tarefa' | 'item_checklist' | 'tarefa_status';
  acao: 'insert' | 'update';
  registro_id: number;
  dados_json: string;
  tentativas: number;
  criado_em: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
}

// Navegação
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Checklist: { tarefaId: number };
};

export type MainTabParamList = {
  Tarefas: undefined;
  Perfil: undefined;
};
